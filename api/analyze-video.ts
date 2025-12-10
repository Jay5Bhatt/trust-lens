import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeVideo } from "../src/lib/gemini-analysis";

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
    const { mediaData } = req.body || {};

    if (!mediaData) {
      res.status(400).json({ error: "mediaData is required" });
      return;
    }

    const result = await analyzeVideo(mediaData);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error analyzing video:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}


