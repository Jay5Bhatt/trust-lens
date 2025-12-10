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
 * Completely bulletproof API call that:
 * - Never throws based on HTTP status code
 * - Always attempts to read JSON regardless of status
 * - Shows backend error message if available
 * - Handles network errors separately
 */
async function callCheckPlagiarism(payload: any): Promise<PlagiarismAPIResponse> {
  let response: Response;

  // Handle network errors (fetch failed, CORS, etc.)
  try {
    response = await fetch("/api/check-plagiarism", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    // Network error - fetch itself failed
    const errorMessage =
      networkError instanceof Error
        ? networkError.message
        : "Network error occurred";
    throw new Error(`Network error: ${errorMessage}. Please check your connection and try again.`);
  }

  // At this point we have a response, regardless of status code
  // Always attempt to read JSON - backend should always return JSON
  let json: any = null;
  let jsonError: Error | null = null;

  try {
    // Try to read as JSON first
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        // Text exists but isn't valid JSON
        jsonError = new Error(
          `Server returned invalid JSON (status ${response.status}): ${text.slice(0, 200)}`
        );
      }
    } else {
      // Empty response body
      jsonError = new Error(`Server returned empty response (status ${response.status})`);
    }
  } catch (readError) {
    // Failed to read response body at all
    jsonError = new Error(
      `Failed to read server response (status ${response.status}): ${
        readError instanceof Error ? readError.message : String(readError)
      }`
    );
  }

  // If we couldn't parse JSON, throw with helpful message
  if (jsonError) {
    throw jsonError;
  }

  // At this point we have JSON, regardless of HTTP status code
  // Backend should always return { success: true/false, ... }
  if (!json || typeof json !== "object") {
    throw new Error(
      `Unexpected response format from server (status ${response.status}). Expected JSON object.`
    );
  }

  // If backend returned an error structure, we'll handle it in the caller
  // Don't throw here - let the caller check json.success
  return json;
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

  try {
    // Call API - this never throws on status codes, only on network/parse errors
    const json = await callCheckPlagiarism(body);

    // Check success flag - backend always returns JSON with success field
    if (json.success === true) {
      if (!json.data) {
        throw new Error("Server returned success but no data field.");
      }
      return json.data;
    } else {
      // Backend returned error in structured format
      // Extract message and errorType
      const errorMessage =
        json.message || json.error || "Analysis failed. Please try again.";
      const errorType = json.errorType || "analysis_error";

      // Create error with backend message
      const error = new Error(errorMessage);
      // Attach errorType to error object for frontend use
      (error as any).errorType = errorType;
      throw error;
    }
  } catch (error) {
    // Re-throw all errors (network, parse, or backend errors)
    // The frontend component will catch and display them
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unexpected error while contacting server.");
  }
}
