import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkPlagiarism } from "../src/lib/services/plagiarismChecker";
import { Logger } from "../src/lib/utils/logger";
import { withTimeout } from "../src/lib/utils/timeout";
import type { PlagiarismAPIResponse } from "../src/lib/types/plagiarism";

const REQUEST_TIMEOUT_MS = 45_000; // 45 seconds

// Simple in-memory rate limiting (in production, use Redis or external service)
const dailyRequestCounts = new Map<string, number>();
const DAILY_LIMIT = process.env.DAILY_REQUEST_LIMIT ? parseInt(process.env.DAILY_REQUEST_LIMIT, 10) : 0;

/**
 * Simple rate limiter (in-memory, resets daily)
 * In production, use Redis or external rate limiting service
 */
function checkRateLimit(identifier: string): boolean {
  if (DAILY_LIMIT === 0) {
    return true; // No limit set
  }

  const today = new Date().toISOString().split("T")[0];
  const key = `${identifier}:${today}`;
  const count = dailyRequestCounts.get(key) || 0;

  if (count >= DAILY_LIMIT) {
    return false;
  }

  dailyRequestCounts.set(key, count + 1);
  return true;
}

/**
 * Sanitize error message for client (remove stack traces, internal details)
 */
function sanitizeErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    let message = error.message;
    
    // Remove stack traces
    message = message.split("\n")[0];
    
    // Remove internal file paths
    message = message.replace(/\/[^\s]+/g, "");
    
    // Make user-friendly
    if (message.includes("timeout")) {
      return "Analysis timed out. Please try again with a shorter text or file.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Network error occurred. Please check your connection and try again.";
    }
    if (message.includes("API key") || message.includes("authentication")) {
      return "Service configuration error. Please contact support.";
    }
    
    return message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Determine error type from error message
 */
function getErrorType(errorMessage: string): "extraction_error" | "analysis_error" | "upstream_error" | "bad_request" {
  if (
    errorMessage.includes("No readable text") ||
    errorMessage.includes("text-based PDF") ||
    errorMessage.includes("too short") ||
    errorMessage.includes("scanned image") ||
    errorMessage.includes("empty")
  ) {
    return "extraction_error";
  }
  
  if (
    errorMessage.includes("Unsupported file type") ||
    errorMessage.includes("must be provided") ||
    errorMessage.includes("too large") ||
    errorMessage.includes("Invalid")
  ) {
    return "bad_request";
  }
  
  if (
    errorMessage.includes("service error") ||
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorMessage.includes("504") ||
    errorMessage.includes("500") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("upstream") ||
    errorMessage.includes("network") ||
    errorMessage.includes("Gemini") ||
    errorMessage.includes("SerpAPI")
  ) {
    return "upstream_error";
  }
  
  return "analysis_error";
}

/**
 * Get HTTP status code from error type
 */
function getStatusCode(errorType: string): number {
  switch (errorType) {
    case "bad_request":
    case "extraction_error":
      return 400;
    case "upstream_error":
      return 502;
    default:
      return 500;
  }
}

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
    res.status(405).json({
      success: false,
      errorType: "bad_request",
      message: "Method not allowed",
    });
    return;
  }

  // Generate correlation ID and create logger
  const logger = new Logger();
  const correlationId = logger.getCorrelationId();

  // Simple rate limiting (use IP or user identifier)
  const rateLimitId = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(String(rateLimitId))) {
    logger.warn("Rate limit exceeded", { identifier: rateLimitId });
    res.status(429).json({
      success: false,
      errorType: "bad_request",
      message: "Daily request limit exceeded. Please try again tomorrow.",
    });
    return;
  }

  logger.info("Plagiarism check request started", {
    method: req.method,
    hasText: !!req.body?.text,
    hasFileBuffer: !!req.body?.fileBuffer,
    fileName: req.body?.fileName,
  });

  try {
    // Wrap entire handler in timeout
    const result = await withTimeout(
      (async () => {
        const body = req.body || {};
        const { text, fileBuffer, fileName } = body;

        // Validate input
        if (!text && !fileBuffer) {
          const errorResponse: PlagiarismAPIResponse = {
            success: false,
            errorType: "bad_request",
            message: "Either 'text' or 'fileBuffer' must be provided",
          };
          logger.warn("Validation failed: missing input");
          return errorResponse;
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
            
            logger.info("File buffer converted", {
              bufferSize: buffer.length,
              fileName,
            });
          } catch (error) {
            const errorResponse: PlagiarismAPIResponse = {
              success: false,
              errorType: "bad_request",
              message: `Invalid fileBuffer format: ${error instanceof Error ? error.message : String(error)}`,
            };
            logger.error("File buffer conversion failed", error);
            return errorResponse;
          }
        }

        // Call plagiarism checker
        const report = await checkPlagiarism({
          text,
          fileBuffer: buffer,
          fileName,
        });

        logger.info("Plagiarism check completed successfully", {
          textLength: report.normalizedTextLength,
          plagiarismPercentage: report.plagiarismPercentage,
          riskLevel: report.riskLevel,
          suspiciousSegments: report.suspiciousSegments.length,
        });

        const successResponse: PlagiarismAPIResponse = {
          success: true,
          data: report,
        };
        return successResponse;
      })(),
      REQUEST_TIMEOUT_MS,
      "Request timeout: analysis exceeded 45 seconds"
    );

    // Send response
    if (result.success) {
      res.status(200).json(result);
    } else {
      const statusCode = getStatusCode(result.errorType);
      res.status(statusCode).json(result);
    }
  } catch (error) {
    logger.error("Plagiarism check failed", error);

    const errorMessage = sanitizeErrorMessage(error);
    const errorType = getErrorType(errorMessage);
    const statusCode = getStatusCode(errorType);

    // Sanitize details (remove stack traces, API keys, etc.)
    let details: string | undefined;
    if (error instanceof Error && error.stack) {
      // Only include first line of stack trace, mask sensitive data
      const stackLines = error.stack.split("\n");
      details = stackLines
        .slice(0, 2)
        .join(" ")
        .replace(/\/[^\s]+/g, "")
        .replace(/api[_-]?key["\s:=]+([a-zA-Z0-9_-]{20,})/gi, "api_key=***MASKED***");
    }

    const errorResponse: PlagiarismAPIResponse = {
      success: false,
      errorType,
      message: errorMessage,
      details,
    };

    res.status(statusCode).json(errorResponse);
  }
}
