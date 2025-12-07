import type { CombinedAnalysisResult } from "./types/media-analysis";

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
 * Browser-friendly wrapper for analyzeImageMedia that calls the Netlify Function
 * Use this in React components instead of the direct analyzeImageMedia function
 * 
 * @param input - File, Buffer, or Base64 string
 * @returns Combined analysis result
 */
export async function analyzeImageMediaAPI(
  input: File | Buffer | string
): Promise<CombinedAnalysisResult> {
  try {
    // Convert input to base64
    let base64Data: string;
    
    if (input instanceof File) {
      base64Data = await fileToBase64(input);
    } else if (Buffer.isBuffer(input)) {
      base64Data = input.toString("base64");
    } else {
      // Assume it's already base64 (with or without data URL prefix)
      const base64Match = input.match(/^data:[\w\/]+;base64,(.+)$/);
      base64Data = base64Match ? base64Match[1] : input;
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
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
    throw new Error(`Image analysis failed: ${String(error)}`);
  }
}

