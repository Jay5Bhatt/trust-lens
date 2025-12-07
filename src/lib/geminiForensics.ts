import { GoogleGenerativeAI } from "@google/generative-ai";
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
 */
function getGeminiClient(): GoogleGenerativeAI {
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
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. " +
      "Please set GEMINI_API_KEY (for Node.js/Netlify Functions) or VITE_GEMINI_API_KEY (for Vite client-side) " +
      "before using the analysis functions."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Validate and parse Gemini forensic analysis result
 */
function validateForensicResult(data: any): GeminiForensicAnalysis {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: Expected an object");
  }

  if (typeof data.synth_id_result !== "string") {
    throw new Error("Invalid response: synth_id_result must be a string");
  }

  if (!Array.isArray(data.visual_observations)) {
    throw new Error("Invalid response: visual_observations must be an array");
  }

  if (!data.visual_observations.every((item: any) => typeof item === "string")) {
    throw new Error("Invalid response: All visual_observations items must be strings");
  }

  const validVerdicts: ForensicVerdict[] = ["likely_ai", "likely_real", "uncertain"];
  if (!validVerdicts.includes(data.overall_verdict)) {
    throw new Error(
      `Invalid response: overall_verdict must be one of: ${validVerdicts.join(", ")}`
    );
  }

  if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
    throw new Error("Invalid response: confidence must be a number between 0 and 1");
  }

  if (typeof data.explanation !== "string") {
    throw new Error("Invalid response: explanation must be a string");
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
 */
function parseForensicResponse(response: string): GeminiForensicAnalysis {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in model response");
    }

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    return validateForensicResult(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON from model response: ${error.message}`);
    }
    throw error;
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
 * Analyze image with Gemini vision model for forensic analysis
 * @param imageBytes - Image as Uint8Array, Buffer, or base64 string
 * @returns Gemini forensic analysis result
 * @throws Error if API key is missing, input is invalid, or analysis fails
 */
export async function analyzeWithGeminiVision(
  imageBytes: Uint8Array | Buffer | string
): Promise<GeminiForensicAnalysis> {
  try {
    const genAI = getGeminiClient();
    
    // Use Gemini 1.5 Flash for faster analysis (or Pro for better accuracy)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convert input to base64
    const base64Data = convertInputToBase64(imageBytes);
    
    // Determine MIME type (default to image/png, can be enhanced)
    const mimeType = "image/png"; // For now, assume PNG. Can be enhanced to detect from input
    
    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    
    // Generate content with the prompt
    const result = await model.generateContent([FORENSIC_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse and validate the response
    return parseForensicResponse(text);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini forensic analysis failed: ${error.message}`);
    }
    throw new Error(`Gemini forensic analysis failed: ${String(error)}`);
  }
}

