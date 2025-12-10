import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runPlagiarismPipeline } from "../src/lib/services/plagiarismPipeline";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = crypto.randomUUID?.() ?? String(Date.now());
  console.log("[check-plagiarism] start", { correlationId, method: req.method });

  try {
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
      res.status(200).json({
        success: false,
        errorType: "bad_request",
        message: "Only POST is allowed.",
      });
      return;
    }

    // Parse body safely
    let body: any;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (parseError) {
      console.error("[check-plagiarism] body parse error", { correlationId, error: parseError });
      res.status(200).json({
        success: false,
        errorType: "bad_request",
        message: "Invalid JSON in request body.",
      });
      return;
    }

    // Convert fileBuffer from base64 to Buffer if provided
    let buffer: Buffer | undefined;
    if (body.fileBuffer) {
      try {
        const base64Data = body.fileBuffer.includes(",")
          ? body.fileBuffer.split(",")[1]
          : body.fileBuffer;
        buffer = Buffer.from(base64Data, "base64");
      } catch (bufferError) {
        console.error("[check-plagiarism] buffer conversion error", { correlationId, error: bufferError });
        res.status(200).json({
          success: false,
          errorType: "bad_request",
          message: `Invalid fileBuffer format: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`,
        });
        return;
      }
    }

    // Run pipeline
    const result = await runPlagiarismPipeline({
      text: body.text,
      fileBuffer: buffer,
      fileName: body.fileName,
    });

    console.log("[check-plagiarism] result", {
      correlationId,
      ok: result.ok,
      errorType: result.errorType,
    });

    if (!result.ok) {
      res.status(200).json({
        success: false,
        errorType: result.errorType || "analysis_error",
        message: result.message || "Analysis failed.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.report,
    });
  } catch (err: any) {
    console.error("[check-plagiarism] fatal", {
      correlationId,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });

    res.status(200).json({
      success: false,
      errorType: "analysis_error",
      message: err?.message || "Unexpected server error.",
    });
  }
}
