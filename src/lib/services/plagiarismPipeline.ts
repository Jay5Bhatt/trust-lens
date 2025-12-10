import { checkPlagiarism } from "./plagiarismChecker";
import type { PlagiarismInput, PlagiarismReport } from "../types/plagiarism";

export type PipelineResult = {
  ok: boolean;
  report?: PlagiarismReport;
  errorType?: "bad_request" | "extraction_error" | "upstream_error" | "analysis_error";
  message?: string;
};

/**
 * Safe wrapper for plagiarism checking pipeline
 * Catches all errors and returns structured result instead of throwing
 */
export async function runPlagiarismPipeline(
  input: PlagiarismInput
): Promise<PipelineResult> {
  try {
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
    const report = await checkPlagiarism(input);
    return { ok: true, report };
  } catch (err: any) {
    const raw = String(err?.message || "Unknown error");

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
      message: message || raw,
    };
  }
}

