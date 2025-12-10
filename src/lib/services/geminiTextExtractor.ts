import { GoogleGenAI } from "@google/genai";
import { retryWithBackoff } from "../utils/retry.js";

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
    throw new Error("BAD_REQUEST: Missing GEMINI_API_KEY on server.");
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
      console.log("[geminiTextExtractor] Starting extraction", {
        fileName: safeFileName,
        mimeType,
        fileSize: fileBuffer.length,
      });

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
              },
            ],
          },
        ],
      });

      console.log("[geminiTextExtractor] Received response", {
        hasCandidates: !!result.candidates,
        candidatesLength: result.candidates?.length || 0,
      });

      // Extract text from response - check all parts
      let text = "";
      if (result?.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if ((part as any).text) {
              text += (part as any).text;
            }
          }
        }
      }

      // Fallback: try direct access
      if (!text) {
        text = (result as any).candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      console.log("[geminiTextExtractor] Extracted text length", {
        textLength: text.length,
        preview: text.slice(0, 100),
      });

      if (!text || text.trim().length < 10) {
        const errorDetails = JSON.stringify(result, null, 2).slice(0, 500);
        throw new Error(
          `Gemini returned empty or invalid text extraction. Response: ${errorDetails}`
        );
      }

      return text.trim();
    },
    3, // maxRetries
    500, // initialDelay
    4500 // maxDelay
  ).catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[geminiTextExtractor] Extraction failed", {
      fileName: safeFileName,
      error: errorMessage,
    });
    throw new Error(`EXTRACTION_ERROR: Text extraction failed: ${errorMessage}`);
  });
}
