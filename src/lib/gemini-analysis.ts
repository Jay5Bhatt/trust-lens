import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Analysis result structure matching the required JSON format
 */
export interface AnalysisResult {
  synth_id_result: string;
  visual_observations: string[];
  overall_verdict: "likely_ai" | "likely_real" | "uncertain";
  confidence: number; // 0-1
  explanation: string;
}

/**
 * The exact analysis prompt as specified
 */
const ANALYSIS_PROMPT = `You are an AI-media forensics analyst. Analyze this media using two layers:

1) SYNTH ID ANALYSIS:
- Run synth_id.check_media (if available).
- Tell me clearly whether the media contains a Google AI watermark or not.
- If SynthID cannot confirm anything, state that clearly.

2) VISUAL FORENSICS (very important):
Examine the media for signs of AI generation or manipulation using visual cues:
- Texture or detail inconsistencies
- Lighting and shadow mismatches
- Distorted geometry or unnatural movements
- Overly smooth or overly sharp regions
- Temporal artifacts or unnatural frame transitions (for video)
- Unrealistic reflections, materials, or skin patterns
- Any signs typical of AI models

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
 * Convert input (Buffer or Base64 string) to base64 string format
 */
function convertInputToBase64(input: Buffer | string): string {
  if (Buffer.isBuffer(input)) {
    return input.toString("base64");
  }
  
  // If it's already a base64 string, check if it has data URL prefix
  if (typeof input === "string") {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Match = input.match(/^data:[\w\/]+;base64,(.+)$/);
    if (base64Match) {
      return base64Match[1];
    }
    // Assume it's already pure base64
    return input;
  }
  
  throw new Error("Invalid input format. Expected Buffer or string (base64).");
}

/**
 * Validate and parse the analysis result from model response
 */
function validateAnalysisResult(data: any): AnalysisResult {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: Expected an object");
  }

  // Validate required fields
  if (typeof data.synth_id_result !== "string") {
    throw new Error("Invalid response: synth_id_result must be a string");
  }

  if (!Array.isArray(data.visual_observations)) {
    throw new Error("Invalid response: visual_observations must be an array");
  }

  if (!data.visual_observations.every((item: any) => typeof item === "string")) {
    throw new Error("Invalid response: All visual_observations items must be strings");
  }

  const validVerdicts = ["likely_ai", "likely_real", "uncertain"];
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
 * Parse and validate JSON response from model
 */
function parseAndValidateResponse(response: string): AnalysisResult {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in model response");
    }

    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    return validateAnalysisResult(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON from model response: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get Gemini API instance
 * Supports both Node.js (process.env) and Vite (import.meta.env) environments
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
      // In Vite, import.meta.env always exists, but the key might be undefined
      apiKey = import.meta?.env?.VITE_GEMINI_API_KEY;
    } catch (e) {
      // import.meta not available (shouldn't happen in Vite, but be safe)
      apiKey = undefined;
    }
  }
  
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. " +
      "Please set VITE_GEMINI_API_KEY (for Vite) or GEMINI_API_KEY (for Node.js) " +
      "before using the analysis functions."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Analyze an image using Gemini vision model
 * 
 * @param input - Image as Buffer or Base64 string
 * @returns Structured analysis result
 * @throws Error if API key is missing, input is invalid, or analysis fails
 */
export async function analyzeImage(input: Buffer | string): Promise<AnalysisResult> {
  try {
    const genAI = getGeminiClient();
    
    // Use Gemini 1.5 Pro for vision capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Convert input to base64
    const base64Data = convertInputToBase64(input);
    
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
    const result = await model.generateContent([ANALYSIS_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse and validate the response
    return parseAndValidateResponse(text);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
    throw new Error(`Image analysis failed: ${String(error)}`);
  }
}

/**
 * Analyze a video using Gemini video-capable model
 * 
 * @param input - Video as Buffer or Base64 string
 * @returns Structured analysis result
 * @throws Error if API key is missing, input is invalid, or analysis fails
 */
export async function analyzeVideo(input: Buffer | string): Promise<AnalysisResult> {
  try {
    const genAI = getGeminiClient();
    
    // Use Gemini 1.5 Pro which supports video
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Convert input to base64
    const base64Data = convertInputToBase64(input);
    
    // Determine MIME type (default to video/mp4, can be enhanced)
    const mimeType = "video/mp4"; // For now, assume MP4. Can be enhanced to detect from input
    
    // Prepare the video part
    const videoPart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    
    // Generate content with the prompt
    const result = await model.generateContent([ANALYSIS_PROMPT, videoPart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse and validate the response
    return parseAndValidateResponse(text);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Video analysis failed: ${error.message}`);
    }
    throw new Error(`Video analysis failed: ${String(error)}`);
  }
}

/**
 * Helper to convert File to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Browser-friendly wrapper for analyzeImage that calls the Netlify Function
 * Use this in your React components instead of the direct analyzeImage function
 * 
 * @param input - File, Buffer, or Base64 string
 * @returns Structured analysis result
 */
export async function analyzeImageAPI(input: File | Buffer | string): Promise<AnalysisResult> {
  try {
    // Convert input to base64
    let base64Data: string;
    
    if (input instanceof File) {
      base64Data = await fileToBase64(input);
    } else if (Buffer.isBuffer(input)) {
      base64Data = input.toString("base64");
    } else {
      base64Data = convertInputToBase64(input);
    }

    const response = await fetch("/.netlify/functions/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaData: base64Data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return validateAnalysisResult(result);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
    throw new Error(`Image analysis failed: ${String(error)}`);
  }
}

/**
 * Browser-friendly wrapper for analyzeVideo that calls the Netlify Function
 * Use this in your React components instead of the direct analyzeVideo function
 * 
 * @param input - File, Buffer, or Base64 string
 * @returns Structured analysis result
 */
export async function analyzeVideoAPI(input: File | Buffer | string): Promise<AnalysisResult> {
  try {
    // Convert input to base64
    let base64Data: string;
    
    if (input instanceof File) {
      base64Data = await fileToBase64(input);
    } else if (Buffer.isBuffer(input)) {
      base64Data = input.toString("base64");
    } else {
      base64Data = convertInputToBase64(input);
    }

    const response = await fetch("/.netlify/functions/analyze-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaData: base64Data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return validateAnalysisResult(result);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Video analysis failed: ${error.message}`);
    }
    throw new Error(`Video analysis failed: ${String(error)}`);
  }
}

