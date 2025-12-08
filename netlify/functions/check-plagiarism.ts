import type { Handler } from "@netlify/functions";
import { checkPlagiarism } from "../../src/lib/services/plagiarismChecker";

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
          error: "Either 'text' or 'fileBuffer' must be provided",
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
            error: `Invalid fileBuffer format: ${error instanceof Error ? error.message : String(error)}`,
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
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error checking plagiarism:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Internal server error",
      }),
    };
  }
};

