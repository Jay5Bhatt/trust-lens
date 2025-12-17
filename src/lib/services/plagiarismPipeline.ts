import { checkPlagiarism } from "./plagiarismChecker.js";
import type { PlagiarismInput, PlagiarismReport } from "../types/plagiarism.js";

export type PipelineResult = {
  ok: boolean;
  report?: PlagiarismReport;
  errorType?: "bad_request" | "extraction_error" | "upstream_error" | "analysis_error";
  message?: string;
  userMessage?: string;
};

/**
 * Safe wrapper for plagiarism checking pipeline
 * Catches all errors and returns structured result instead of throwing
 */
/**
 * Safe wrapper for plagiarism checking pipeline
 * Catches all errors and returns structured result instead of throwing
 * This function NEVER throws - it always returns a PipelineResult
 */
export async function runPlagiarismPipeline(
  input: PlagiarismInput
): Promise<PipelineResult> {
  try {
    // Validate input
    if (!input || (typeof input !== "object")) {
      return {
        ok: false,
        errorType: "bad_request",
        message: "Invalid input: expected an object with 'text' or 'fileBuffer'.",
      };
    }

    const hasText = typeof input?.text === "string" && input.text.trim().length > 0;
    const hasFile = !!input?.fileBuffer;

    if (!hasText && !hasFile) {
      return {
        ok: false,
        errorType: "bad_request",
        message: "Please provide either text or an uploaded document.",
      };
    }

    // Delegate to existing checker
    // This may throw, but we catch it below
    const report = await checkPlagiarism(input);
    
    // Validate report
    if (!report || typeof report !== "object") {
      return {
        ok: false,
        errorType: "analysis_error",
        message: "Plagiarism checker returned invalid result.",
      };
    }

    return { ok: true, report };
  } catch (err: any) {
    // Catch ANY error - including non-Error objects, null, undefined, etc.
    const raw = String(err?.message || err?.toString() || "Unknown error");

    let errorType: PipelineResult["errorType"] = "analysis_error";

    if (raw.startsWith("BAD_REQUEST:")) {
      errorType = "bad_request";
    } else if (raw.startsWith("EXTRACTION_ERROR:")) {
      errorType = "extraction_error";
    } else if (raw.startsWith("UPSTREAM_ERROR:")) {
      errorType = "upstream_error";
    }

    const message = raw
      .replace("BAD_REQUEST:", "")
      .replace("EXTRACTION_ERROR:", "")
      .replace("UPSTREAM_ERROR:", "")
      .trim();

    return {
      ok: false,
      errorType,
      message: message || "An unexpected error occurred during analysis.",
      userMessage:
        errorType === "upstream_error"
          ? "Search service is temporarily unavailable. Please try again later or use the demo examples."
          : undefined,
    };
  }
}

