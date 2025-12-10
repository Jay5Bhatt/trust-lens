import { analyzeWithGeminiVision } from "./geminiForensics.js";
import type { GeminiForensicAnalysis } from "./types/media-analysis.js";

/**
 * Analyze video using Gemini forensic analysis
 * Note: Currently uses the same image analysis function
 * @param input - Video as Buffer or base64 string
 * @returns Gemini forensic analysis result
 */
export async function analyzeVideo(
  input: Buffer | string
): Promise<GeminiForensicAnalysis> {
  // For now, treat video the same as image analysis
  // In the future, this could be enhanced with video-specific analysis
  return analyzeWithGeminiVision(input);
}
