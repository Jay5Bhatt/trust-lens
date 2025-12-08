import { GoogleGenAI } from "@google/genai";
import type { TextChunk, SourceMatch, WebSearchResult } from "../types/plagiarism";

/**
 * Get Gemini API client (reusing pattern from geminiForensics.ts)
 */
function getGeminiClient(): GoogleGenAI | null {
  let apiKey: string | undefined;

  // Try Node.js environment variable first (for server-side/Netlify Functions)
  if (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  // Fallback to Vite environment variable (for browser/client-side)
  if (!apiKey) {
    try {
      apiKey = import.meta?.env?.VITE_GEMINI_API_KEY;
    } catch (e) {
      apiKey = undefined;
    }
  }

  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Similarity scoring prompt for Gemini
 */
const SIMILARITY_PROMPT = `Given a THESIS CHUNK and a WEB SNIPPET, analyze the similarity between them.

Consider:
- Direct word-for-word matches
- Paraphrased content with same meaning
- Structural similarities
- Key concepts and ideas overlap

Return ONLY a JSON object with this exact structure:
{
  "similarity": 0.0-1.0
}

where:
- 0.0 = completely different, no plagiarism
- 0.5 = some similarity, possible paraphrasing
- 1.0 = strong plagiarism (even if paraphrased)

Be strict: only return high similarity (0.7+) if the content is clearly derived from the source.`;

/**
 * Score a chunk against web search results using Gemini
 * Returns suspicious flag, similarity score, and matched sources
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

  // Score chunk against each source
  let criticalError: Error | null = null;
  for (const source of sources) {
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

/**
 * Score a single chunk against a single source using Gemini
 */
async function scoreChunkAgainstSource(
  ai: GoogleGenAI,
  chunkText: string,
  source: WebSearchResult
): Promise<number> {
  try {
    const sourceText = `${source.title || ""}\n${source.snippet || ""}`.trim();
    
    const prompt = `${SIMILARITY_PROMPT}

THESIS CHUNK:
${chunkText.slice(0, 1000)}

WEB SNIPPET:
${sourceText.slice(0, 500)}`;

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

