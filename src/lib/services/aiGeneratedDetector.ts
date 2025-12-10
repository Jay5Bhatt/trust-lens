import { GoogleGenAI } from "@google/genai";
import type { AIDetectionResult, AIVerdict } from "../types/plagiarism.js";
import { retryWithBackoff } from "../utils/retry.js";
import { getCache, setCache, getAICacheKey } from "../utils/cache.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day
const MAX_TEXT_LENGTH = 200_000; // 200k characters

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
 * Exact AI detection prompt as specified
 */
const AI_DETECTION_PROMPT = `You are an expert in distinguishing human-written academic text from modern LLM output. Analyze the input and return ONLY a JSON object with keys: likelihood (0.0-1.0) and verdict (likely_ai | likely_human | uncertain). Avoid 0.0 or 1.0 exact values; use confidence thresholds: >=0.7 => likely_ai, <=0.3 => likely_human, else uncertain. Consider structure, repetition, punctuation, and statistical artifacts.`;

/**
 * Detect if text is AI-generated using Gemini
 * Uses caching to avoid duplicate API calls
 */
export async function detectAIGeneratedText(
  fullText: string
): Promise<AIDetectionResult> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("BAD_REQUEST: Missing GEMINI_API_KEY on server.");
  }

  // Truncate text if too long (cap at 200k)
  const textToAnalyze = fullText.slice(0, MAX_TEXT_LENGTH).trim();

  // Check cache first
  const cacheKey = getAICacheKey(textToAnalyze);
  const cached = await getCache(cacheKey);
  if (cached && typeof cached === "object" && "likelihood" in cached && "verdict" in cached) {
    return cached as AIDetectionResult;
  }

  try {
    const prompt = `${AI_DETECTION_PROMPT}

TEXT TO ANALYZE:
${textToAnalyze}`;

    // Retry with exponential backoff
    const result = await retryWithBackoff(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });

        const text =
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          JSON.stringify(response);

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          if (
            typeof parsed.likelihood === "number" &&
            typeof parsed.verdict === "string"
          ) {
            // Clamp likelihood to avoid extremes, but allow 0.01-0.99 range
            const rawLikelihood = parsed.likelihood;
            const likelihood = Math.max(0.01, Math.min(0.99, rawLikelihood));
            const verdict = parsed.verdict as AIVerdict;

            // Validate and enforce verdict based on likelihood thresholds
            const validVerdicts: AIVerdict[] = ["likely_ai", "likely_human", "uncertain"];
            let finalVerdict: AIVerdict;

            if (validVerdicts.includes(verdict)) {
              finalVerdict = verdict;
            } else {
              // Auto-determine verdict based on likelihood if verdict is invalid
              if (likelihood >= 0.7) {
                finalVerdict = "likely_ai";
              } else if (likelihood <= 0.3) {
                finalVerdict = "likely_human";
              } else {
                finalVerdict = "uncertain";
              }
            }

            const detectionResult: AIDetectionResult = {
              likelihood,
              verdict: finalVerdict,
            };

            // Cache result
            await setCache(cacheKey, detectionResult, CACHE_TTL_SECONDS);

            return detectionResult;
          }
        }

        // Fallback: if we can't parse, return uncertain
        console.warn("Failed to parse AI detection result from Gemini response");
        return {
          likelihood: 0.5,
          verdict: "uncertain",
        };
      },
      3, // maxRetries
      500, // initialDelay
      5000 // maxDelay
    );

    return result;
  } catch (error) {
    // Check if this is a critical API error (502, 5xx, network error)
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
      errorMessage.includes("UPSTREAM_ERROR") ||
      errorMessage.includes("BAD_REQUEST")
    ) {
      // Ensure error has proper prefix
      if (!errorMessage.includes("UPSTREAM_ERROR") && !errorMessage.includes("BAD_REQUEST")) {
        throw new Error(`UPSTREAM_ERROR: AI detection service error: ${errorMessage}`);
      }
      // Re-throw critical errors so they propagate to the caller
      throw error;
    }
    // For non-critical errors (parsing, etc.), log and return uncertain
    console.error("Error in AI detection:", error);
    return {
      likelihood: 0.5,
      verdict: "uncertain",
    };
  }
}
