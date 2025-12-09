import { GoogleGenAI } from "@google/genai";
import type { TextChunk, SourceMatch, WebSearchResult } from "../types/plagiarism";
import { retryWithBackoff } from "../utils/retry";
import { getCache, setCache, getSimilarityCacheKey } from "../utils/cache";

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day
const TOP_N_RESULTS = 5; // Process top 5 results per chunk

/**
 * Get Gemini API client
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Exact similarity scoring prompt as specified
 */
const SIMILARITY_PROMPT = `You are an expert plagiarism scorer. Given the CHUNK_TEXT and the WEB_SNIPPET, return ONLY a JSON object: {"similarity": <0.0-1.0>}. Similarity 1.0 means direct copy; 0.6 means strong paraphrase; 0.0 means unrelated.`;

/**
 * Score a single chunk against a single source using Gemini
 * Uses caching to avoid duplicate API calls
 */
async function scoreChunkAgainstSource(
  ai: GoogleGenAI,
  chunkText: string,
  source: WebSearchResult
): Promise<number> {
  const sourceText = `${source.title || ""}\n${source.snippet || ""}`.trim();
  
  // Check cache first
  const cacheKey = getSimilarityCacheKey(chunkText, sourceText);
  const cached = await getCache(cacheKey);
  if (cached !== null && typeof cached === "number") {
    return cached;
  }

  try {
    const prompt = `${SIMILARITY_PROMPT}

CHUNK_TEXT:
${chunkText.slice(0, 1000)}

WEB_SNIPPET:
${sourceText.slice(0, 500)}`;

    // Retry with exponential backoff
    const similarity = await retryWithBackoff(
      async () => {
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });

        const text =
          result.candidates?.[0]?.content?.parts?.[0]?.text ||
          JSON.stringify(result);

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.similarity === "number") {
            return Math.max(0, Math.min(1, parsed.similarity));
          }
        }

        // Fallback: if we can't parse, return 0
        console.warn("Failed to parse similarity score from Gemini response");
        return 0;
      },
      3, // maxRetries
      500, // initialDelay
      5000 // maxDelay
    );

    // Cache result
    await setCache(cacheKey, similarity, CACHE_TTL_SECONDS);

    return similarity;
  } catch (error) {
    // Check if this is a critical API error (502, 5xx, network error) - if so, rethrow
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
      errorMessage.includes("service error")
    ) {
      throw error; // Re-throw critical errors so they propagate
    }
    // For non-critical errors (parsing, etc.), log and return 0
    console.error("Error in similarity scoring:", error);
    return 0;
  }
}

/**
 * Score a chunk against web search results using Gemini
 * Returns suspicious flag, similarity score, and matched sources
 * Processes top N=5 results per chunk
 */
export async function scoreChunkAgainstSources(
  chunk: TextChunk,
  sources: WebSearchResult[]
): Promise<{
  suspicious: boolean;
  similarityScore: number;
  matches: SourceMatch[];
}> {
  if (sources.length === 0) {
    return {
      suspicious: false,
      similarityScore: 0,
      matches: [],
    };
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.warn("Gemini API key not available, skipping similarity scoring");
    return {
      suspicious: false,
      similarityScore: 0,
      matches: [],
    };
  }

  const matches: SourceMatch[] = [];

  // Process top N results (limit to TOP_N_RESULTS)
  const topSources = sources.slice(0, TOP_N_RESULTS);
  let criticalError: Error | null = null;

  for (const source of topSources) {
    try {
      const similarity = await scoreChunkAgainstSource(ai, chunk.text, source);

      if (similarity > 0.3) {
        // Only include sources with meaningful similarity
        matches.push({
          url: source.url,
          title: source.title,
          snippet: source.snippet,
          similarityScore: similarity,
        });
      }
    } catch (error) {
      // Check if this is a critical error - if so, save it and break
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
        errorMessage.includes("service error")
      ) {
        criticalError = error instanceof Error ? error : new Error(String(error));
        break; // Stop processing and propagate critical error
      }
      // For non-critical errors, log and continue with other sources
      console.error(`Error scoring against source ${source.url}:`, error);
    }
  }

  // If we had a critical error, throw it now
  if (criticalError) {
    throw criticalError;
  }

  // Sort matches by similarity score (highest first)
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  // Determine if chunk is suspicious (highest similarity > 0.5)
  const maxSimilarity = matches.length > 0 ? matches[0].similarityScore : 0;
  const suspicious = maxSimilarity > 0.5;

  return {
    suspicious,
    similarityScore: maxSimilarity,
    matches,
  };
}
