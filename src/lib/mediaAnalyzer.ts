import { analyzeMetadata } from "./metadataAnalyzer.js";
import { analyzeWithGeminiVision } from "./geminiForensics.js";
import type { CombinedAnalysisResult } from "./types/media-analysis.js";

/**
 * Normalize input to Buffer/Uint8Array
 */
function normalizeInput(input: Buffer | string): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  }
  
  if (typeof input === "string") {
    // Handle base64 string (with or without data URL prefix)
    const base64Match = input.match(/^data:[\w\/]+;base64,(.+)$/);
    const base64Data = base64Match ? base64Match[1] : input;
    return Buffer.from(base64Data, "base64");
  }
  
  throw new Error("Invalid input format. Expected Buffer or string (base64).");
}

/**
 * Analyze image media with 2-step process: metadata analysis + Gemini forensic analysis
 * @param input - Image as Buffer or base64 string (data URL or plain base64)
 * @returns Combined analysis result with both metadata and forensic analysis
 * @throws Error if input is invalid or analysis fails
 */
export async function analyzeImageMedia(
  input: Buffer | string
): Promise<CombinedAnalysisResult> {
  // Normalize input to Buffer
  const imageBuffer = normalizeInput(input);
  
  // Step 1: EXIF / metadata analysis
  const metadata = await analyzeMetadata(imageBuffer);
  
  // Step 2: Gemini forensic analysis
  const forensic = await analyzeWithGeminiVision(imageBuffer);
  
  // Return combined result
  return {
    metadata,
    forensic,
  };
}






