import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkPlagiarism } from "../src/lib/services/plagiarismChecker";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const { text, fileBuffer, fileName } = body;

    // Validate input
    if (!text && !fileBuffer) {
      res.status(400).json({
        success: false,
        errorType: "bad_request",
        message: "Either 'text' or 'fileBuffer' must be provided",
      });
      return;
    }

    // Convert base64 fileBuffer to Buffer if provided
    let buffer: Buffer | undefined;
    if (fileBuffer) {
      try {
        // Remove data URL prefix if present
        const base64Data = fileBuffer.includes(",")
          ? fileBuffer.split(",")[1]
          : fileBuffer;
        buffer = Buffer.from(base64Data, "base64");
      } catch (error) {
        res.status(400).json({
          success: false,
          errorType: "bad_request",
          message: `Invalid fileBuffer format: ${error instanceof Error ? error.message : String(error)}`,
        });
        return;
      }
    }

    // Call plagiarism checker
    const result = await checkPlagiarism({
      text,
      fileBuffer: buffer,
      fileName,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking plagiarism:", error);
    
    // Determine error type and status code
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    let errorType: "extraction_error" | "analysis_error" | "bad_request" = "analysis_error";
    let statusCode = 500;

    // Check for extraction errors
    if (errorMessage.includes("No readable text") || errorMessage.includes("text-based PDF") || errorMessage.includes("too short")) {
      errorType = "extraction_error";
      statusCode = 400;
    }
    // Check for upstream service errors (502, network errors, etc.)
    else if (errorMessage.includes("service error") || errorMessage.includes("502") || errorMessage.includes("upstream")) {
      errorType = "analysis_error";
      statusCode = 502;
    }
    // Check for bad request errors
    else if (errorMessage.includes("Unsupported file type") || errorMessage.includes("must be provided")) {
      errorType = "bad_request";
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      errorType,
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}

