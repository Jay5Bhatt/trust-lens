import type { VercelRequest, VercelResponse } from "@vercel/node";

// Use a lazy dynamic import so that import-time errors can be caught
type PipelineResult = {
  ok: boolean;
  report?: any;
  errorType?: "bad_request" | "extraction_error" | "upstream_error" | "analysis_error";
  message?: string;
};

/**
 * Helper to ensure CORS headers are always set
 */
function setCORSHeaders(res: VercelResponse): void {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");
  } catch (err) {
    // If setting headers fails, log but continue
    console.error("[check-plagiarism] failed to set CORS headers", err);
  }
}

/**
 * Safe JSON response helper that always returns 200
 */
function sendJSONResponse(
  res: VercelResponse,
  data: { success: boolean; errorType?: string; message?: string; data?: any }
): void {
  try {
    setCORSHeaders(res);
    res.status(200).json(data);
  } catch (err) {
    // Last resort: try to send response without headers
    console.error("[check-plagiarism] failed to send JSON response", err);
    try {
      res.status(200).json(data);
    } catch (finalErr) {
      console.error("[check-plagiarism] completely failed to send response", finalErr);
    }
  }
}

async function getPipeline(): Promise<(input: any) => Promise<PipelineResult>> {
  try {
    // Use relative import - Vercel should resolve this correctly
    const mod = await import("../src/lib/services/plagiarismPipeline");
    if (!mod || typeof mod.runPlagiarismPipeline !== "function") {
      throw new Error("Pipeline function not found in module");
    }
    return mod.runPlagiarismPipeline as (input: any) => Promise<PipelineResult>;
  } catch (err: any) {
    console.error("[check-plagiarism] failed to import pipeline", {
      error: err?.message || String(err),
      stack: err?.stack,
    });
    // Return a stub pipeline that always reports an error
    return async () => ({
      ok: false,
      errorType: "analysis_error",
      message: "Failed to load plagiarism pipeline on server. Please check server logs.",
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());
  console.log("[check-plagiarism] start", { correlationId, method: req.method });

  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Set CORS headers early
    setCORSHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    if (req.method !== "POST") {
      sendJSONResponse(res, {
        success: false,
        errorType: "bad_request",
        message: "Only POST is allowed for this endpoint.",
      });
      return;
    }

    // Parse body safely
    let body: any;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (parseError) {
      console.error("[check-plagiarism] body parse error", { correlationId, error: parseError });
      sendJSONResponse(res, {
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
        console.error("[check-plagiarism] buffer conversion error", {
          correlationId,
          error: bufferError,
        });
        sendJSONResponse(res, {
          success: false,
          errorType: "bad_request",
          message: `Invalid fileBuffer format: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`,
        });
        return;
      }
    }

    // Get pipeline (dynamic import)
    let pipeline: (input: any) => Promise<PipelineResult>;
    try {
      pipeline = await getPipeline();
    } catch (pipelineError) {
      console.error("[check-plagiarism] pipeline initialization error", {
        correlationId,
        error: pipelineError,
      });
      sendJSONResponse(res, {
        success: false,
        errorType: "analysis_error",
        message: "Failed to initialize plagiarism pipeline.",
      });
      return;
    }

    // Run pipeline
    let result: PipelineResult;
    try {
      result = await pipeline({
        text: body.text,
        fileBuffer: buffer,
        fileName: body.fileName,
      });
    } catch (pipelineRunError) {
      console.error("[check-plagiarism] pipeline execution error", {
        correlationId,
        error: pipelineRunError,
      });
      sendJSONResponse(res, {
        success: false,
        errorType: "analysis_error",
        message:
          pipelineRunError instanceof Error
            ? pipelineRunError.message
            : "Pipeline execution failed.",
      });
      return;
    }

    console.log("[check-plagiarism] result", {
      correlationId,
      ok: result.ok,
      errorType: result.errorType,
    });

    if (!result.ok) {
      sendJSONResponse(res, {
        success: false,
        errorType: result.errorType || "analysis_error",
        message: result.message || "Analysis failed due to an unknown error.",
      });
      return;
    }

    sendJSONResponse(res, {
      success: true,
      data: result.report,
    });
  } catch (err: any) {
    // Catch-all for any unexpected errors
    console.error("[check-plagiarism] fatal error", {
      correlationId,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });

    // IMPORTANT: still 200, never 500
    sendJSONResponse(res, {
      success: false,
      errorType: "analysis_error",
      message: err?.message || "Unexpected server error. Please try again.",
    });
  }
}
