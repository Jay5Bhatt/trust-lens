import type { PlagiarismReport } from "./types/plagiarism";

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
 * Calls the Netlify Function endpoint
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

  const response = await fetch("/.netlify/functions/check-plagiarism", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

