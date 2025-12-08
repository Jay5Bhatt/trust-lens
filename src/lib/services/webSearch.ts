import type { WebSearchResult } from "../types/plagiarism";

/**
 * Search the web for a text chunk using SerpAPI
 * Returns search results with URL, title, and snippet
 */
export async function searchWebForChunk(
  chunkText: string
): Promise<WebSearchResult[]> {
  const apiKey = process.env.SEARCH_API_KEY;

  if (!apiKey) {
    console.warn("SEARCH_API_KEY not set, skipping web search");
    return [];
  }

  try {
    // Truncate query if too long (SerpAPI has limits)
    const query = chunkText.slice(0, 500).trim();
    if (!query) {
      return [];
    }

    const url = new URL("https://serpapi.com/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("engine", "google");
    url.searchParams.set("num", "10"); // Get top 10 results

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI error: ${response.status} - ${errorText}`);
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse SerpAPI response format
    const results: WebSearchResult[] = [];

    // Handle organic_results array
    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const result of data.organic_results) {
        if (result.link) {
          results.push({
            url: result.link,
            title: result.title,
            snippet: result.snippet,
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Web search error:", error);
    // Return empty array on error - caller will handle gracefully
    return [];
  }
}

