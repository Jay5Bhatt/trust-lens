import { GoogleGenAI } from "@google/genai";
import { retryWithBackoff } from "../utils/retry";

/**
 * Get Gemini API client
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Extract text from PDF or DOCX file using Gemini
 * Uses inlineData with base64 encoding and file name
 * @param fileBuffer - File buffer (PDF or DOCX)
 * @param mimeType - MIME type (application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document)
 * @param fileName - File name (must be non-empty, fallback to uploaded.pdf or uploaded.docx)
 * @returns Extracted text
 */
export async function extractTextWithGemini(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key not available");
  }

  // Ensure fileName is non-empty
  let safeFileName = fileName.trim();
  if (!safeFileName) {
    // Determine default filename based on mimeType
    if (mimeType.includes("pdf")) {
      safeFileName = "uploaded.pdf";
    } else if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) {
      safeFileName = "uploaded.docx";
    } else {
      safeFileName = "uploaded.file";
    }
  }

  // Convert buffer to base64
  const base64Data = fileBuffer.toString("base64");

  const prompt = "Extract the full readable text content from this document. Return ONLY plain text.";

  // Retry with exponential backoff (500ms, 1500ms, 4500ms)
  return retryWithBackoff(
    async () => {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
                name: safeFileName,
              } as any, // Type assertion needed for inlineData with name
            ],
          },
        ],
      });

      const text =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "";

      if (!text || text.trim().length < 10) {
        throw new Error("Gemini returned empty or invalid text extraction");
      }

      return text.trim();
    },
    3, // maxRetries
    500, // initialDelay
    4500 // maxDelay
  ).catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Text extraction failed: ${errorMessage}`);
  });
}
