import type { PlagiarismInput } from "../types/plagiarism";
import { extractTextWithGemini } from "./geminiTextExtractor";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 200_000; // 200k characters
const MIN_TEXT_LENGTH = 50; // Minimum required characters

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

/**
 * Extract and normalize text from various input formats
 * Supports PDF, DOCX, and TXT files, or raw text
 */
export async function extractTextFromInput(
  input: PlagiarismInput
): Promise<string> {
  // If raw text is provided, use it directly
  if (input.text) {
    if (!input.text.trim()) {
      throw new Error("Text input is empty");
    }
    return normalizeText(input.text);
  }

  // If file buffer is provided, extract based on file extension
  if (input.fileBuffer) {
    const fileName = input.fileName || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    // Check file size limit
    if (input.fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File too large. Limit 10MB. Your file is ${(input.fileBuffer.length / 1024 / 1024).toFixed(2)}MB.`
      );
    }

    let extractedText: string;

    switch (extension) {
      case "pdf":
      case "docx": {
        // Use Gemini for PDF and DOCX extraction
        const mimeType = getMimeType(fileName);
        try {
          extractedText = await extractTextWithGemini(
            input.fileBuffer,
            mimeType,
            fileName || (extension === "pdf" ? "uploaded.pdf" : "uploaded.docx")
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to extract text from ${extension.toUpperCase()}: ${errorMessage}`
          );
        }
        break;
      }
      case "txt": {
        // Direct text extraction for TXT files
        try {
          extractedText = input.fileBuffer.toString("utf-8");
        } catch (error) {
          throw new Error(
            `Failed to extract text from TXT: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        break;
      }
      default:
        throw new Error(
          `Unsupported file type: ${extension}. Supported types: PDF, DOCX, TXT`
        );
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < MIN_TEXT_LENGTH) {
      throw new Error(
        "No readable text found in this file. If your file is a scanned image, use OCR or upload the original text."
      );
    }

    return normalizeText(extractedText);
  }

  throw new Error("Either 'text' or 'fileBuffer' must be provided");
}

/**
 * Normalize extracted text
 * - Remove excessive whitespace
 * - Strip bad characters (including null bytes)
 * - Preserve language
 * - Cap at 200k characters (truncate but note original length)
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input: text is empty or not a string");
  }

  // Remove null bytes and other control characters (except newlines and tabs)
  let normalized = text
    .replace(/\x00/g, "") // Remove null bytes
    .replace(/\r\n/g, "\n") // Normalize line breaks
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .replace(/[ \t]+/g, " ") // Collapse multiple spaces/tabs
    .trim();

  // Remove non-printable characters except newlines and tabs
  normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Validate minimum length
  if (normalized.length < MIN_TEXT_LENGTH) {
    throw new Error(
      `Text is too short (${normalized.length} characters). Minimum required: ${MIN_TEXT_LENGTH} characters.`
    );
  }

  // Cap at maximum length (200k characters)
  const originalLength = normalized.length;
  if (normalized.length > MAX_TEXT_LENGTH) {
    normalized = normalized.slice(0, MAX_TEXT_LENGTH);
  }

  // Store original length in a way that can be accessed later if needed
  // (We'll handle this in the plagiarism checker to include in explanation)
  return normalized;
}

/**
 * Get original text length before truncation (if truncated)
 * This is a helper to track if text was truncated
 */
export function getOriginalTextLength(text: string, normalized: string): number {
  // If normalized is shorter than original, it was truncated
  // Otherwise return normalized length
  return text.length > normalized.length ? text.length : normalized.length;
}
