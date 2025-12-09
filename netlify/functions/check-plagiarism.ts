import type { Handler } from "@netlify/functions";
import { checkPlagiarism } from "../../src/lib/services/plagiarismChecker";

// DISABLED: This Netlify Function has been migrated to Vercel API route at api/check-plagiarism.ts
// Kept for reference only - not used at runtime
/*
export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, fileBuffer, fileName } = body;

    // Validate input
    if (!text && !fileBuffer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          errorType: "bad_request",
          message: "Either 'text' or 'fileBuffer' must be provided",
        }),
      };
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
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            errorType: "bad_request",
            message: `Invalid fileBuffer format: ${error instanceof Error ? error.message : String(error)}`,
          }),
        };
      }
    }

    // Call plagiarism checker
    const result = await checkPlagiarism({
      text,
      fileBuffer: buffer,
      fileName,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
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

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        errorType,
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};
*/

