import type { PlagiarismReport, PlagiarismAPIResponse } from "./types/plagiarism";

/**
 * Browser-side input type (File instead of Buffer)
 */
export type PlagiarismInputBrowser = {
  text?: string;
  fileBuffer?: File;
  fileName?: string;
};

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Browser-side API wrapper for plagiarism checking
 * Calls the Vercel API route endpoint
 */
export async function checkPlagiarismAPI(
  input: PlagiarismInputBrowser | { text: string } | { fileBuffer: File; fileName?: string }
): Promise<PlagiarismReport> {
  let body: any = {};

  if ("text" in input && input.text) {
    body.text = input.text;
  } else if ("fileBuffer" in input && input.fileBuffer) {
    // Convert File to base64
    const base64 = await fileToBase64(input.fileBuffer);
    body.fileBuffer = base64;
    body.fileName = input.fileName || input.fileBuffer.name;
  } else {
    throw new Error("Either 'text' or 'fileBuffer' must be provided");
  }

  let response: Response;
  try {
    response = await fetch("/api/check-plagiarism", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // Handle network errors (fetch failed, CORS, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Network error: ${errorMessage}. Please check your connection and try again.`);
  }

  // Parse response JSON
  let responseData: PlagiarismAPIResponse;
  try {
    responseData = await response.json();
  } catch (error) {
    // If JSON parsing fails, throw with HTTP status
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check for success flag
  if (!response.ok || !responseData.success) {
    // Handle error response
    if (!responseData.success) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      // Attach errorType to error object for frontend use
      (error as any).errorType = responseData.errorType;
      throw error;
    }
    // Fallback for non-OK responses without structured error
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Return the PlagiarismReport from successful response
  return responseData.data;
}

