import { GoogleGenAI } from "@google/genai";
import type { AIDetectionResult, AIVerdict } from "../types/plagiarism";

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
 * AI detection prompt for Gemini
 */
const AI_DETECTION_PROMPT = `You are an expert in detecting whether a long academic text was written by a human or by a modern large language model (LLM).

Consider repetition, structure, style, and subtle artifacts.

Analyze the text for:
- Repetitive patterns or structures
- Overly formal or generic language
- Lack of personal voice or unique perspective
- Unusual consistency in tone and style
- Absence of natural errors or inconsistencies
- Overuse of certain phrases or transitions

Return ONLY a JSON object with this exact structure:
{
  "likelihood": 0.0-1.0,
  "verdict": "likely_ai" | "likely_human" | "uncertain"
}

where:
- likelihood: the probability the text was written by an AI/LLM (0.0 = very likely human, 1.0 = very likely AI)
- verdict: 
  * "likely_ai" if likelihood >= 0.7 (reasonably confident it's AI-generated)
  * "likely_human" if likelihood <= 0.3 (reasonably confident it's human-written)
  * "uncertain" otherwise

Never return exactly 0 or 1 for likelihood. Use values between 0.01 and 0.99.`;

/**
 * Detect if text is AI-generated using Gemini
 */
export async function detectAIGeneratedText(
  fullText: string
): Promise<AIDetectionResult> {
  const ai = getGeminiClient();
  if (!ai) {
    console.warn("Gemini API key not available, returning uncertain result");
    return {
      likelihood: 0,
      verdict: "uncertain",
    };
  }

  try {
    // Truncate text if too long (Gemini has token limits)
    const textToAnalyze = fullText.slice(0, 8000).trim();

    const prompt = `${AI_DETECTION_PROMPT}

TEXT TO ANALYZE:
${textToAnalyze}`;

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

        return {
          likelihood,
          verdict: finalVerdict,
        };
      }
    }

    // Fallback: if we can't parse, return uncertain
    console.warn("Failed to parse AI detection result from Gemini response");
    return {
      likelihood: 0.5,
      verdict: "uncertain",
    };
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
      errorMessage.includes("timeout")
    ) {
      // Re-throw critical errors so they propagate to the caller
      throw new Error(`AI detection service error: ${errorMessage}`);
    }
    // For non-critical errors (parsing, etc.), log and return uncertain
    console.error("Error in AI detection:", error);
    return {
      likelihood: 0.5,
      verdict: "uncertain",
    };
  }
}

