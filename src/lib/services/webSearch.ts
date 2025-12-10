import type { WebSearchResult } from "../types/plagiarism.js";
import { retryWithBackoff } from "../utils/retry.js";
import { getCache, setCache, getChunkCacheKey } from "../utils/cache.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day

/**
 * Search the web for a text chunk using SerpAPI
 * Returns search results with URL, title, and snippet
 * Uses caching to avoid duplicate API calls
 */
export async function searchWebForChunk(
  chunkText: string
): Promise<WebSearchResult[]> {
  const apiKey = process.env.SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error("BAD_REQUEST: Missing SEARCH_API_KEY on server.");
  }

  // Check cache first
  const cacheKey = getChunkCacheKey(chunkText);
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log("Web search cache hit");
    return cached;
  }

  try {
    // Truncate query if too long (SerpAPI has limits)
    const query = chunkText.slice(0, 500).trim();
    if (!query) {
      return [];
    }

    // Retry with exponential backoff
    const results = await retryWithBackoff(
      async () => {
        const url = new URL("https://serpapi.com/search");
        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("q", query);
        url.searchParams.set("engine", "google");
        url.searchParams.set("num", "10"); // Get top 10 results

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
          throw new Error("UPSTREAM_ERROR: Rate limit exceeded. Please try again later.");
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`SerpAPI error: ${response.status} - ${errorText}`);
          throw new Error(`UPSTREAM_ERROR: SerpAPI request failed: ${response.status}`);
        }

        const data = await response.json();

        // Parse SerpAPI response format
        const parsedResults: WebSearchResult[] = [];

        // Handle organic_results array
        if (data.organic_results && Array.isArray(data.organic_results)) {
          for (const result of data.organic_results) {
            if (result.link) {
              parsedResults.push({
                url: result.link,
                title: result.title,
                snippet: result.snippet,
              });
            }
          }
        }

        return parsedResults;
      },
      3, // maxRetries
      500, // initialDelay
      5000 // maxDelay
    );

    // Cache results
    await setCache(cacheKey, results, CACHE_TTL_SECONDS);

    return results;
  } catch (error) {
    // Check if this is a critical error (502, 5xx, network error) - if so, rethrow
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("502") ||
      errorMessage.includes("500") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("5xx") ||
      errorMessage.includes("network") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("SerpAPI request failed") ||
      errorMessage.includes("UPSTREAM_ERROR") ||
      errorMessage.includes("BAD_REQUEST")
    ) {
      // Ensure error has proper prefix
      if (!errorMessage.includes("UPSTREAM_ERROR") && !errorMessage.includes("BAD_REQUEST")) {
        throw new Error(`UPSTREAM_ERROR: ${errorMessage}`);
      }
      throw error; // Re-throw critical errors so they propagate
    }
    // For non-critical errors (rate limits, etc.), log and return empty array
    console.error("Web search error (non-critical):", error);
    return [];
  }
}
