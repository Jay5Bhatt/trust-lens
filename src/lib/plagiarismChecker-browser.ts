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
 * Robust API call that always reads JSON and never throws on !response.ok
 */
async function callCheckPlagiarism(payload: any): Promise<PlagiarismAPIResponse> {
  const response = await fetch("/api/check-plagiarism", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let json: any = null;

  try {
    json = await response.json();
  } catch (err) {
    // If server returns non-JSON, fall back to text
    const text = await response.text().catch(() => "");
    throw new Error(
      `Server returned invalid JSON (status ${response.status}): ${text || "no body"}`
    );
  }

  // At this point we ALWAYS have a JSON object.
  // The backend uses { success: true/false, ... }.
  if (!json || typeof json !== "object") {
    throw new Error("Unexpected response format from server.");
  }

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
    const json = await callCheckPlagiarism(body);

    // Check success flag - backend always returns JSON with success field
    if (json.success === true) {
      if (!json.data) {
        throw new Error("Server returned success but no data field.");
      }
      return json.data;
    } else {
      // Backend returned error in structured format
      const errorMessage = json.message || "Analysis failed.";
      const error = new Error(errorMessage);
      // Attach errorType to error object for frontend use
      (error as any).errorType = json.errorType;
      throw error;
    }
  } catch (error) {
    // Re-throw network errors and other exceptions
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unexpected error while contacting server.");
  }
}
