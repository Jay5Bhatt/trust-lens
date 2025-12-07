import { analyzeExifMetadata, type ExifAnalysisResult } from "./exif-analysis";
import { analyzeImageAPI, type AnalysisResult as GeminiResult } from "./gemini-analysis";
import type { AnalysisResult, Anomaly, Severity } from "@/components/demo/types";

/**
 * Combined analysis result with both EXIF and Gemini data
 */
export interface CombinedAnalysisResult {
  exif: ExifAnalysisResult;
  gemini: GeminiResult;
  final: AnalysisResult;
}

/**
 * Perform 2-step analysis: EXIF metadata first, then Gemini AI analysis
 * @param file - Image file to analyze
 * @returns Combined analysis result
 */
export async function analyzeImageCombined(file: File): Promise<AnalysisResult> {
  // Step 1: EXIF Metadata Analysis
  const exifResult = await analyzeExifMetadata(file);

  // Step 2: Gemini AI Analysis
  let geminiResult: GeminiResult;
  try {
    geminiResult = await analyzeImageAPI(file);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // If Gemini fails, return result based on EXIF only
    return convertToAnalysisResult(exifResult, null, file.name);
  }

  // Step 3: Combine results
  return convertToAnalysisResult(exifResult, geminiResult, file.name);
}

/**
 * Convert EXIF and Gemini results to UI AnalysisResult format
 */
function convertToAnalysisResult(
  exifResult: ExifAnalysisResult,
  geminiResult: GeminiResult | null,
  fileName: string
): AnalysisResult {
  const anomalies: Anomaly[] = [];

  // Add EXIF anomalies first
  exifResult.anomalies.forEach((anomaly) => {
    let severity: Severity = "Medium";
    const lowerAnomaly = anomaly.toLowerCase();
    
    if (lowerAnomaly.includes("no exif") || lowerAnomaly.includes("missing")) {
      // Missing EXIF is common and not necessarily suspicious - mark as Low severity
      severity = "Low";
    } else if (lowerAnomaly.includes("suspicious")) {
      severity = "High";
    }

    anomalies.push({
      title: "EXIF Metadata Issue",
      description: anomaly,
      severity,
    });
  });

  // Add EXIF metadata info as anomaly if suspicious
  if (exifResult.suspicious && exifResult.hasExif) {
    anomalies.push({
      title: "Metadata Inconsistency",
      description: `EXIF data present but contains suspicious elements. Camera: ${exifResult.metadata.camera || "Unknown"}, Software: ${exifResult.metadata.software || "Unknown"}`,
      severity: "Medium",
    });
  }

  // Add Gemini results if available
  if (geminiResult) {
    // Convert Gemini visual observations to anomalies
    geminiResult.visual_observations.forEach((obs, index) => {
      let severity: Severity = "Medium";
      const lowerObs = obs.toLowerCase();
      
      if (lowerObs.includes("critical") || lowerObs.includes("artifact") || lowerObs.includes("manipulation")) {
        severity = "Critical";
      } else if (lowerObs.includes("high") || lowerObs.includes("inconsistency") || lowerObs.includes("mismatch")) {
        severity = "High";
      } else if (lowerObs.includes("good") || lowerObs.includes("authentic") || lowerObs.includes("genuine")) {
        severity = "Good";
      } else if (lowerObs.includes("low") || lowerObs.includes("minor")) {
        severity = "Low";
      }

      anomalies.push({
        title: `Visual Analysis ${index + 1}`,
        description: obs,
        severity,
      });
    });

    // Add SynthID result if present
    if (geminiResult.synth_id_result && geminiResult.synth_id_result.toLowerCase().includes("watermark")) {
      anomalies.unshift({
        title: "SynthID Watermark Detection",
        description: geminiResult.synth_id_result,
        severity: "Critical",
      });
    }
  }

  // Calculate final score based on both analyses
  let score: number;
  let status: string;
  let color: "red" | "yellow" | "green";

  if (geminiResult) {
    // Use Gemini verdict as primary, adjust based on EXIF
    if (geminiResult.overall_verdict === "likely_ai") {
      score = Math.floor((1 - geminiResult.confidence) * 30) + 10; // 10-40 range
      // Lower score if EXIF is also suspicious
      if (exifResult.suspicious) {
        score = Math.max(5, score - 10);
      }
      status = "AI-GENERATED CONTENT DETECTED";
      color = "red";
    } else if (geminiResult.overall_verdict === "likely_real") {
      score = Math.floor(geminiResult.confidence * 20) + 80; // 80-100 range
      // Only lower score if EXIF has actual suspicious indicators (not just missing data)
      if (exifResult.suspicious) {
        score = Math.max(70, score - 10); // Less penalty, trust Gemini more
      }
      status = "LIKELY AUTHENTIC";
      color = "green";
    } else {
      score = Math.floor(geminiResult.confidence * 40) + 40; // 40-80 range
      // Adjust based on EXIF
      if (exifResult.suspicious) {
        score = Math.max(30, score - 10);
      }
      status = "UNCERTAIN - REVIEW NEEDED";
      color = "yellow";
    }
  } else {
    // Gemini failed, use EXIF only
    if (exifResult.suspicious) {
      // Only show suspicious if there are actual red flags, not just missing EXIF
      score = Math.floor((1 - exifResult.confidence) * 40) + 20; // 20-60 range
      status = "SUSPICIOUS METADATA";
      color = "yellow";
    } else {
      // Missing EXIF alone is not suspicious - show as informational
      score = Math.floor(exifResult.confidence * 30) + 60; // 60-90 range
      status = exifResult.hasExif ? "METADATA CHECK PASSED" : "METADATA ANALYSIS COMPLETE";
      color = "green";
    }
  }

  // Create reality trace combining both analyses
  const realityTrace = [
    {
      step: exifResult.hasExif ? "EXIF Metadata Extracted" : "No EXIF Data Found",
      confidence: exifResult.hasExif ? Math.floor(exifResult.confidence * 100) : 0,
    },
    {
      step: geminiResult ? "AI Visual Analysis Completed" : "AI Analysis Unavailable",
      confidence: geminiResult ? Math.floor(geminiResult.confidence * 100) : 0,
    },
    {
      step: "Combined Assessment",
      confidence: geminiResult
        ? Math.floor((exifResult.confidence + geminiResult.confidence) / 2 * 100)
        : Math.floor(exifResult.confidence * 100),
    },
  ];

  // Determine risk and category
  let risk: "HIGH" | "MEDIUM" | "LOW";
  let category: string;
  let impact: string;
  let recommendation: string;

  if (geminiResult) {
    if (geminiResult.overall_verdict === "likely_ai") {
      risk = "HIGH";
      category = "AI-Generated Content";
      impact = geminiResult.explanation;
      recommendation = exifResult.suspicious
        ? "Both AI analysis and metadata checks indicate this content is likely generated. Verify source before trusting."
        : "AI analysis indicates this content is likely generated. Verify source before trusting.";
    } else if (geminiResult.overall_verdict === "likely_real") {
      risk = exifResult.suspicious ? "MEDIUM" : "LOW";
      category = exifResult.suspicious ? "Metadata Concerns" : "Appears Authentic";
      impact = exifResult.suspicious
        ? "Content appears authentic but metadata shows inconsistencies"
        : geminiResult.explanation;
      recommendation = exifResult.suspicious
        ? "Content appears authentic but metadata is suspicious. Additional verification recommended."
        : "Content appears authentic based on analysis.";
    } else {
      risk = exifResult.suspicious ? "MEDIUM" : "MEDIUM";
      category = "Insufficient Data";
      impact = geminiResult.explanation;
      recommendation = exifResult.suspicious
        ? "Analysis is uncertain and metadata is suspicious. Additional verification strongly recommended."
        : "Additional verification recommended.";
    }
  } else {
    // Gemini failed
    risk = exifResult.suspicious ? "MEDIUM" : "LOW";
    category = "Metadata Analysis Only";
    impact = exifResult.suspicious
      ? "Metadata analysis indicates potential issues. Full AI analysis unavailable."
      : "Metadata check passed. Full AI analysis unavailable.";
    recommendation = "Please try uploading again for complete analysis.";
  }

  return {
    score,
    status,
    color,
    anomalies,
    realityTrace,
    truthScore: {
      risk,
      category,
      impact,
      recommendation,
    },
    sourceMatch: {
      template: geminiResult && geminiResult.synth_id_result && geminiResult.synth_id_result.includes("watermark")
        ? false
        : exifResult.suspicious
        ? false
        : "N/A",
      online: false,
      format: geminiResult
        ? geminiResult.overall_verdict === "likely_ai"
          ? "Failed AI detection checks"
          : "Passed basic checks"
        : exifResult.suspicious
        ? "Failed metadata checks"
        : "Passed metadata checks",
    },
  };
}

