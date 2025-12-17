import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withTimeout } from "../src/lib/utils/timeout.js";

// Use a lazy dynamic import so that import-time errors can be caught
type PipelineResult = {
  ok: boolean;
  report?: any;
  errorType?: "bad_request" | "extraction_error" | "upstream_error" | "analysis_error";
  message?: string;
  userMessage?: string;
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

// Note: We don't use process.on('unhandledRejection') in Vercel serverless
// as it can interfere with Vercel's own error handling. All errors are caught
// within the handler's try-catch blocks.

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
  data: { success: boolean; errorType?: string; message?: string; userMessage?: string; data?: any }
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
  
  const safeSendResponse = (data: { success: boolean; errorType?: string; message?: string; userMessage?: string; data?: any }) => {
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
        userMessage: "File is too large. Please use a smaller file (max 10MB) or paste the text directly.",
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
        userMessage: "Invalid request method. Please use the web interface.",
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
          userMessage: "Request is too large. Please use a smaller file (max 10MB) or paste the text directly.",
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
        userMessage: "Invalid request format. Please try again or use the web interface.",
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
        userMessage: "Text is too long. Please split your text into smaller chunks or use the demo examples.",
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
            userMessage: "File is too large. Please use a smaller file (max 10MB) or paste the text directly.",
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
          userMessage: "Invalid file format. Please upload a valid PDF, DOCX, or TXT file.",
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
        errorType: typeof pipelineError,
        errorMessage: pipelineError instanceof Error ? pipelineError.message : String(pipelineError),
        errorStack: pipelineError instanceof Error ? pipelineError.stack : undefined,
      });
      safeSendResponse({
        success: false,
        errorType: "analysis_error",
        message: "Failed to initialize plagiarism pipeline. Please try again.",
        userMessage: "Service initialization failed. Please try again or use the demo examples.",
      });
      return;
    }

    // Run pipeline with timeout protection (8 seconds max for Vercel Hobby plan)
    const pipelineStartTime = Date.now();
    let result: PipelineResult;
    try {
      console.log("[check-plagiarism] starting pipeline", {
        correlationId,
        hasText: !!body.text,
        hasFileBuffer: !!buffer,
        fileName: body.fileName,
        fileSize: buffer?.length,
        textLength: body.text?.length,
      });

      // Ensure pipeline is a function before calling
      if (typeof pipeline !== "function") {
        throw new Error("Pipeline is not a function. Pipeline initialization may have failed.");
      }

      result = await withTimeout(
        pipeline({
          text: body.text,
          fileBuffer: buffer,
          fileName: body.fileName,
        }),
        REQUEST_TIMEOUT_MS,
        "Analysis timed out. Please try again with a smaller document or shorter text."
      );
      
      // Validate result is a valid PipelineResult
      if (!result || typeof result !== "object") {
        throw new Error("Pipeline returned invalid result: not an object");
      }
      if (typeof result.ok !== "boolean") {
        throw new Error("Pipeline returned invalid result: missing 'ok' field");
      }
      
      const pipelineElapsed = Date.now() - pipelineStartTime;
      console.log("[check-plagiarism] pipeline completed", {
        correlationId,
        elapsed: `${pipelineElapsed}ms`,
        ok: result.ok,
        errorType: result.errorType,
        message: result.message?.slice(0, 100),
        hasReport: !!result.report,
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
      
      const userMessage = isTimeout
        ? "Analysis timed out. Please try again with a smaller document or shorter text, or paste the text directly for faster results."
        : errorMessage;
      
      safeSendResponse({
        success: false,
        errorType: "analysis_error",
        message: isTimeout 
          ? "Analysis timed out. Please try again with a smaller document or shorter text."
          : errorMessage,
        userMessage: userMessage,
      });
      return;
    }

    console.log("[check-plagiarism] result", {
      correlationId,
      ok: result.ok,
      errorType: result.errorType,
    });

    if (!result.ok) {
      const errorType = result.errorType || "analysis_error";
      const errorMessage = result.message || "Analysis failed due to an unknown error.";
      
      // Determine if this is an extraction timeout
      const isExtractionTimeout = errorType === "extraction_error" && 
        (errorMessage.includes("timed out") || errorMessage.includes("timeout"));
      
      // Set user-friendly message based on error type
      let userMessage: string;
      if (result.userMessage) {
        userMessage = result.userMessage;
      } else if (isExtractionTimeout) {
        userMessage = "Large documents take longer to analyze. For instant results, paste text or use demo examples.";
      } else if (errorType === "upstream_error") {
        userMessage = "Search service is temporarily unavailable. Please try again later or use the demo examples.";
      } else if (errorType === "extraction_error") {
        userMessage = "We couldn't read text from this file. Please upload a text-based PDF or paste the text directly.";
      } else {
        userMessage = errorMessage; // Use the same message as default
      }
      
      safeSendResponse({
        success: false,
        errorType: isExtractionTimeout ? "extraction_timeout" : errorType,
        message: errorMessage,
        userMessage: userMessage,
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
      userMessage: "An unexpected error occurred. Please try again or use the demo examples.",
    });
  } finally {
    const totalElapsed = Date.now() - startTime;
    console.log("[check-plagiarism] handler completed", {
      correlationId,
      totalElapsed: `${totalElapsed}ms`,
    });
  }
}
