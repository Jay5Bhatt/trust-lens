import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withTimeout } from "../src/lib/utils/timeout.js";

// Use a lazy dynamic import so that import-time errors can be caught
type PipelineResult = {
  ok: boolean;
  report?: any;
  errorType?: "bad_request" | "extraction_error" | "upstream_error" | "analysis_error";
  message?: string;
};

// Vercel timeout limits:
// Hobby plan: 10 seconds
// Pro plan: 60 seconds
// Use 8 seconds to leave buffer for response sending
const REQUEST_TIMEOUT_MS = 8 * 1000;

// Maximum request body size (10MB)
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;

// Maximum text length to process (100k chars to stay within timeout)
const MAX_TEXT_LENGTH = 100_000;

// Track handler state for unhandled rejection handler
let currentHandlerState: {
  res?: VercelResponse;
  responseSent?: boolean;
  correlationId?: string;
} | null = null;

// Handle unhandled promise rejections
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("[check-plagiarism] Unhandled promise rejection", {
      reason: reason?.message || String(reason),
      stack: reason?.stack,
      correlationId: currentHandlerState?.correlationId,
    });
    
    // Try to send error response if handler is still active
    if (currentHandlerState?.res && !currentHandlerState?.responseSent) {
      try {
        currentHandlerState.responseSent = true;
        currentHandlerState.res.status(200).json({
          success: false,
          errorType: "analysis_error",
          message: "An unexpected error occurred during processing. Please try again.",
        });
      } catch (err) {
        console.error("[check-plagiarism] Failed to send error response for unhandled rejection", err);
      }
    }
  });
}

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
    const mod = await import("../src/lib/services/plagiarismPipeline.js");
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
  const startTime = Date.now();
  
  // Ensure response is always sent, even if handler crashes
  let responseSent = false;
  
  const safeSendResponse = (data: { success: boolean; errorType?: string; message?: string; data?: any }) => {
    if (responseSent) return;
    responseSent = true;
    const elapsed = Date.now() - startTime;
    console.log("[check-plagiarism] sending response", {
      correlationId,
      elapsed: `${elapsed}ms`,
      success: data.success,
    });
    try {
      sendJSONResponse(res, data);
    } catch (err) {
      // Last resort - try to send raw JSON
      try {
        res.status(200).json(data);
      } catch (finalErr) {
        console.error("[check-plagiarism] Failed to send response completely", finalErr);
      }
    }
  };

  const correlationId = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());
  
  // Set handler state for unhandled rejection handler
  currentHandlerState = {
    res,
    responseSent: false,
    correlationId,
  };
  
  console.log("[check-plagiarism] start", {
    correlationId,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Check request size early
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE_BYTES) {
      console.warn("[check-plagiarism] request too large", {
        correlationId,
        size: contentLength,
        max: MAX_REQUEST_SIZE_BYTES,
      });
      safeSendResponse({
        success: false,
        errorType: "bad_request",
        message: `Request too large. Maximum size is ${MAX_REQUEST_SIZE_BYTES / 1024 / 1024}MB.`,
      });
      return;
    }

    // Set CORS headers early
    setCORSHeaders(res);

    if (req.method === "OPTIONS") {
      responseSent = true;
      res.status(200).end();
      return;
    }

    if (req.method !== "POST") {
      safeSendResponse({
        success: false,
        errorType: "bad_request",
        message: "Only POST is allowed for this endpoint.",
      });
      return;
    }

    // Parse body safely
    let body: any;
    try {
      const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      
      // Check body size after stringification
      if (bodyString.length > MAX_REQUEST_SIZE_BYTES) {
        console.warn("[check-plagiarism] body too large after parsing", {
          correlationId,
          size: bodyString.length,
          max: MAX_REQUEST_SIZE_BYTES,
        });
        safeSendResponse({
          success: false,
          errorType: "bad_request",
          message: `Request body too large. Maximum size is ${MAX_REQUEST_SIZE_BYTES / 1024 / 1024}MB.`,
        });
        return;
      }
      
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (parseError) {
      console.error("[check-plagiarism] body parse error", { correlationId, error: parseError });
      safeSendResponse({
        success: false,
        errorType: "bad_request",
        message: "Invalid JSON in request body.",
      });
      return;
    }

    // Validate text length early
    if (body.text && typeof body.text === "string" && body.text.length > MAX_TEXT_LENGTH) {
      console.warn("[check-plagiarism] text too long", {
        correlationId,
        length: body.text.length,
        max: MAX_TEXT_LENGTH,
      });
      safeSendResponse({
        success: false,
        errorType: "bad_request",
        message: `Text is too long. Maximum length is ${MAX_TEXT_LENGTH.toLocaleString()} characters. Please split your text into smaller chunks.`,
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
        
        // Estimate buffer size (base64 is ~4/3 of original size)
        const estimatedSize = (base64Data.length * 3) / 4;
        if (estimatedSize > MAX_REQUEST_SIZE_BYTES) {
          console.warn("[check-plagiarism] file too large", {
            correlationId,
            estimatedSize,
            max: MAX_REQUEST_SIZE_BYTES,
          });
          safeSendResponse({
            success: false,
            errorType: "bad_request",
            message: `File is too large. Maximum size is ${MAX_REQUEST_SIZE_BYTES / 1024 / 1024}MB.`,
          });
          return;
        }
        
        buffer = Buffer.from(base64Data, "base64");
        
        // Verify actual buffer size
        if (buffer.length > MAX_REQUEST_SIZE_BYTES) {
          console.warn("[check-plagiarism] buffer too large after conversion", {
            correlationId,
            size: buffer.length,
            max: MAX_REQUEST_SIZE_BYTES,
          });
          safeSendResponse({
            success: false,
            errorType: "bad_request",
            message: `File is too large. Maximum size is ${MAX_REQUEST_SIZE_BYTES / 1024 / 1024}MB.`,
          });
          return;
        }
      } catch (bufferError) {
        console.error("[check-plagiarism] buffer conversion error", {
          correlationId,
          error: bufferError,
        });
        safeSendResponse({
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
      safeSendResponse({
        success: false,
        errorType: "analysis_error",
        message: "Failed to initialize plagiarism pipeline.",
      });
      return;
    }

    // Run pipeline with timeout protection (8 seconds max for Vercel Hobby plan)
    const pipelineStartTime = Date.now();
    let result: PipelineResult;
    try {
      result = await withTimeout(
        pipeline({
          text: body.text,
          fileBuffer: buffer,
          fileName: body.fileName,
        }),
        REQUEST_TIMEOUT_MS,
        "Analysis timed out. Please try again with a smaller document or shorter text."
      );
      
      const pipelineElapsed = Date.now() - pipelineStartTime;
      console.log("[check-plagiarism] pipeline completed", {
        correlationId,
        elapsed: `${pipelineElapsed}ms`,
        ok: result.ok,
      });
    } catch (pipelineRunError) {
      console.error("[check-plagiarism] pipeline execution error", {
        correlationId,
        error: pipelineRunError,
      });
      
      const errorMessage = pipelineRunError instanceof Error 
        ? pipelineRunError.message 
        : "Pipeline execution failed.";
      
      // Check if it's a timeout error
      const isTimeout = errorMessage.includes("timed out") || errorMessage.includes("timeout");
      
      safeSendResponse({
        success: false,
        errorType: "analysis_error",
        message: isTimeout 
          ? "Analysis timed out. Please try again with a smaller document or shorter text."
          : errorMessage,
      });
      return;
    }

    console.log("[check-plagiarism] result", {
      correlationId,
      ok: result.ok,
      errorType: result.errorType,
    });

    if (!result.ok) {
      safeSendResponse({
        success: false,
        errorType: result.errorType || "analysis_error",
        message: result.message || "Analysis failed due to an unknown error.",
      });
      return;
    }

    safeSendResponse({
      success: true,
      data: result.report,
    });
  } catch (err: any) {
    // Catch-all for any unexpected errors
    const elapsed = Date.now() - startTime;
    console.error("[check-plagiarism] fatal error", {
      correlationId,
      elapsed: `${elapsed}ms`,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });

    // IMPORTANT: still 200, never 500
    safeSendResponse({
      success: false,
      errorType: "analysis_error",
      message: err?.message || "Unexpected server error. Please try again.",
    });
  } finally {
    // Clear handler state
    currentHandlerState = null;
    const totalElapsed = Date.now() - startTime;
    console.log("[check-plagiarism] handler completed", {
      correlationId,
      totalElapsed: `${totalElapsed}ms`,
    });
  }
}
