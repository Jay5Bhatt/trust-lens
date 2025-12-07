import { GoogleGenAI } from "@google/genai";
import type { GeminiForensicAnalysis, ForensicVerdict } from "./types/media-analysis";

/**
 * The exact analysis prompt as specified
 */
const FORENSIC_PROMPT = `You are an AI-media forensics analyst. Analyze this image using two layers:

1) SYNTH ID ANALYSIS:
- Run synth_id.check_media (if available).
- Tell me clearly whether the image contains a Google AI watermark or not.
- If SynthID cannot confirm anything, state that clearly.

2) VISUAL FORENSICS (very important):
Examine the image for signs of AI generation or manipulation using visual cues:
- Texture uniformity, skin detail, pore patterns
- Lighting inconsistencies
- Object distortions or geometry errors
- Depth of field or shadow anomalies
- Over-enhanced colors or cinematic exaggeration
- Strange artifacts around hands, eyes, or hair
- Unrealistic materials or reflections

3) OUTPUT FORMAT:
Return results strictly in this JSON structure:

{
  "synth_id_result": "<result>",
  "visual_observations": [
    "bullet point 1",
    "bullet point 2",
    "bullet point 3"
  ],
  "overall_verdict": "likely_ai | likely_real | uncertain",
  "confidence": 0-1,
  "explanation": "Short explanation for normal users."
}

Be cautious and never claim 100% certainty.`;

/**
 * Get Gemini API client
 * Returns null if API key is missing (caller should handle gracefully)
 */
function getGeminiClient(): GoogleGenAI | null {
  let apiKey: string | undefined;
  
  // Try Node.js environment variable first (for server-side/Netlify Functions)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
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
    console.error(
      "GEMINI_API_KEY environment variable is not set. " +
      "Please set GEMINI_API_KEY (for Node.js/Netlify Functions) or VITE_GEMINI_API_KEY (for Vite client-side)"
    );
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Validate and parse Gemini forensic analysis result
 * Returns fallback on validation errors instead of throwing
 */
function validateForensicResult(data: any): GeminiForensicAnalysis {
  if (!data || typeof data !== "object") {
    console.error("Invalid response: Expected an object");
    return createFallbackForensicResult("Invalid response: Expected an object");
  }

  if (typeof data.synth_id_result !== "string") {
    console.error("Invalid response: synth_id_result must be a string");
    return createFallbackForensicResult("Invalid response: synth_id_result must be a string");
  }

  if (!Array.isArray(data.visual_observations)) {
    console.error("Invalid response: visual_observations must be an array");
    return createFallbackForensicResult("Invalid response: visual_observations must be an array");
  }

  if (!data.visual_observations.every((item: any) => typeof item === "string")) {
    console.error("Invalid response: All visual_observations items must be strings");
    return createFallbackForensicResult("Invalid response: All visual_observations items must be strings");
  }

  const validVerdicts: ForensicVerdict[] = ["likely_ai", "likely_real", "uncertain"];
  if (!validVerdicts.includes(data.overall_verdict)) {
    console.error(`Invalid response: overall_verdict must be one of: ${validVerdicts.join(", ")}`);
    return createFallbackForensicResult(`Invalid response: overall_verdict must be one of: ${validVerdicts.join(", ")}`);
  }

  if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
    console.error("Invalid response: confidence must be a number between 0 and 1");
    return createFallbackForensicResult("Invalid response: confidence must be a number between 0 and 1");
  }

  if (typeof data.explanation !== "string") {
    console.error("Invalid response: explanation must be a string");
    return createFallbackForensicResult("Invalid response: explanation must be a string");
  }

  return {
    synth_id_result: data.synth_id_result,
    visual_observations: data.visual_observations,
    overall_verdict: data.overall_verdict,
    confidence: data.confidence,
    explanation: data.explanation,
  };
}

/**
 * Parse JSON response from model, handling cases where response has extra text
 * Returns fallback on parse errors instead of throwing
 */
function parseForensicResponse(response: string): GeminiForensicAnalysis {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON object found in model response");
      return createFallbackForensicResult("No JSON object found in model response");
    }

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    return validateForensicResult(parsed);
  } catch (error) {
    console.error("Failed to parse forensic response:", error);
    // Return fallback instead of throwing
    return createFallbackForensicResult(
      error instanceof Error ? error.message : "Failed to parse JSON response"
    );
  }
}

/**
 * Convert input to base64 string format
 */
function convertInputToBase64(input: Buffer | Uint8Array | string): string {
  if (Buffer.isBuffer(input)) {
    return input.toString("base64");
  }
  
  if (input instanceof Uint8Array) {
    return Buffer.from(input).toString("base64");
  }
  
  // If it's already a base64 string, check if it has data URL prefix
  if (typeof input === "string") {
    const base64Match = input.match(/^data:[\w\/]+;base64,(.+)$/);
    if (base64Match) {
      return base64Match[1];
    }
    // Assume it's already pure base64
    return input;
  }
  
  throw new Error("Invalid input format. Expected Buffer, Uint8Array, or string (base64).");
}

/**
 * Create a safe fallback forensic analysis result for errors
 */
function createFallbackForensicResult(errorMessage?: string): GeminiForensicAnalysis {
  return {
    overall_verdict: "uncertain",
    confidence: 0,
    explanation: "Forensic analysis failed due to a model error.",
    synth_id_result: "Analysis error",
    visual_observations: [],
  };
}

/**
 * Analyze image with Gemini vision model for forensic analysis
 * @param imageBytes - Image as Uint8Array, Buffer, or base64 string
 * @returns Gemini forensic analysis result (or fallback on error)
 */
export async function analyzeWithGeminiVision(
  imageBytes: Uint8Array | Buffer | string
): Promise<GeminiForensicAnalysis> {
  try {
    const ai = getGeminiClient();
    
    // If API key is missing, return fallback
    if (!ai) {
      console.error("Gemini API key not available");
      return createFallbackForensicResult("API key not available");
    }
    
    // Convert input to base64
    const base64Data = convertInputToBase64(imageBytes);
    
    // Determine MIME type (default to image/png, can be enhanced)
    const mimeType = "image/png"; // For now, assume PNG. Can be enhanced to detect from input
    
    // Prepare contents array with prompt and image
    const contents = [
      {
        role: "user",
        parts: [
          { text: FORENSIC_PROMPT },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ],
      },
    ];
    
    // Generate content with the new SDK API
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });
    
    // Extract text from response
    // The new SDK response structure - check candidates array
    let text: string;
    if (result?.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        const textPart = candidate.content.parts.find((part: any) => part.text);
        if (textPart?.text) {
          text = textPart.text;
        } else {
          console.error("No text found in response parts");
          return createFallbackForensicResult("No text found in Gemini API response");
        }
      } else {
        console.error("No content parts found in response");
        return createFallbackForensicResult("No content parts found in Gemini API response");
      }
    } else {
      console.error("No candidates found in response:", result);
      return createFallbackForensicResult("No candidates found in Gemini API response");
    }
    
    // Parse and validate the response
    return parseForensicResponse(text);
  } catch (error) {
    // Log error for debugging but return fallback instead of throwing
    console.error("Gemini forensic analysis error:", error);
    
    // Return safe fallback - do NOT throw errors
    // This allows the analysis to continue with metadata-only results
    return createFallbackForensicResult(
      error instanceof Error ? error.message : String(error)
    );
  }
}

