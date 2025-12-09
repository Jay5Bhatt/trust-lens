import type { Handler } from "@netlify/functions";
import { analyzeImageMedia } from "../../src/lib/mediaAnalyzer";

// DISABLED: This Netlify Function has been migrated to Vercel API route at api/analyze-image.ts
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
    const { mediaData } = JSON.parse(event.body || "{}");

    if (!mediaData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "mediaData is required" }),
      };
    }

    // mediaData is base64 string, analyzeImageMedia accepts Buffer or string
    const result = await analyzeImageMedia(mediaData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
    };
  }
};
*/

