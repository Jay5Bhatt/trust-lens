import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import type { PlagiarismInput } from "../types/plagiarism";

// Handle ESM/CommonJS compatibility for pdf-parse
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;

/**
 * Extract and normalize text from various input formats
 * Supports PDF, DOCX, and TXT files, or raw text
 */
export async function extractTextFromInput(
  input: PlagiarismInput
): Promise<string> {
  // If raw text is provided, use it directly
  if (input.text) {
    return normalizeText(input.text);
  }

  // If file buffer is provided, extract based on file extension
  if (input.fileBuffer) {
    const fileName = input.fileName || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    let extractedText: string;

    switch (extension) {
      case "pdf":
        extractedText = await extractFromPDF(input.fileBuffer);
        break;
      case "docx":
        extractedText = await extractFromDOCX(input.fileBuffer);
        break;
      case "txt":
        extractedText = extractFromTXT(input.fileBuffer);
        break;
      default:
        throw new Error(
          `Unsupported file type: ${extension}. Supported types: PDF, DOCX, TXT`
        );
    }

    return normalizeText(extractedText);
  }

  throw new Error("Either 'text' or 'fileBuffer' must be provided");
}

/**
 * Extract text from PDF buffer
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const extractedText = data.text || "";
    
    // Check if extracted text is empty or too short (likely a scanned PDF)
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. Please upload a text-based PDF (not a scanned image)."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value || "";
    
    // Check if extracted text is empty or too short
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. The document may be empty or corrupted."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract text from TXT buffer
 */
function extractFromTXT(buffer: Buffer): string {
  try {
    const extractedText = buffer.toString("utf-8");
    
    // Check if extracted text is empty or too short
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. The file may be empty or contain only whitespace."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from TXT: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Normalize extracted text
 * - Remove excessive whitespace
 * - Strip bad characters
 * - Validate minimum length
 */
function normalizeText(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input: text is empty or not a string");
  }

  // Remove excessive whitespace and normalize line breaks
  let normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Remove non-printable characters except newlines and tabs
  normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Validate minimum length (at least 50 characters)
  if (normalized.length < 50) {
    throw new Error(
      `Text is too short (${normalized.length} characters). Minimum required: 50 characters.`
    );
  }

  return normalized;
}


import type { PlagiarismInput } from "../types/plagiarism";

// Handle pdf-parse ESM/CommonJS compatibility
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;

/**
 * Extract and normalize text from various input formats
 * Supports PDF, DOCX, and TXT files, or raw text
 */
export async function extractTextFromInput(
  input: PlagiarismInput
): Promise<string> {
  // If raw text is provided, use it directly
  if (input.text) {
    return normalizeText(input.text);
  }

  // If file buffer is provided, extract based on file extension
  if (input.fileBuffer) {
    const fileName = input.fileName || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    let extractedText: string;

    switch (extension) {
      case "pdf":
        extractedText = await extractFromPDF(input.fileBuffer);
        break;
      case "docx":
        extractedText = await extractFromDOCX(input.fileBuffer);
        break;
      case "txt":
        extractedText = extractFromTXT(input.fileBuffer);
        break;
      default:
        throw new Error(
          `Unsupported file type: ${extension}. Supported types: PDF, DOCX, TXT`
        );
    }

    return normalizeText(extractedText);
  }

  throw new Error("Either 'text' or 'fileBuffer' must be provided");
}

/**
 * Extract text from PDF buffer
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const extractedText = data.text || "";
    
    // Check if extracted text is empty or too short (likely a scanned PDF)
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. Please upload a text-based PDF (not a scanned image)."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value || "";
    
    // Check if extracted text is empty or too short
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. The document may be empty or corrupted."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract text from TXT buffer
 */
function extractFromTXT(buffer: Buffer): string {
  try {
    const extractedText = buffer.toString("utf-8");
    
    // Check if extracted text is empty or too short
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "No readable text found in this file. The file may be empty or contain only whitespace."
      );
    }
    
    return extractedText;
  } catch (error) {
    // Re-throw our custom error as-is
    if (error instanceof Error && error.message.includes("No readable text")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from TXT: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Normalize extracted text
 * - Remove excessive whitespace
 * - Strip bad characters
 * - Validate minimum length
 */
function normalizeText(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input: text is empty or not a string");
  }

  // Remove excessive whitespace and normalize line breaks
  let normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Remove non-printable characters except newlines and tabs
  normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Validate minimum length (at least 50 characters)
  if (normalized.length < 50) {
    throw new Error(
      `Text is too short (${normalized.length} characters). Minimum required: 50 characters.`
    );
  }

  return normalized;
}

