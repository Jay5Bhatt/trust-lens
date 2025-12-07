import { analyzeImageMediaAPI } from "./mediaAnalyzer-browser";
import type { CombinedAnalysisResult as NewCombinedResult } from "./types/media-analysis";
import type { AnalysisResult, Anomaly, Severity } from "@/components/demo/types";

/**
 * Perform 2-step analysis: EXIF metadata first, then Gemini AI analysis
 * Browser-friendly version that calls Netlify Function
 * @param file - Image file to analyze
 * @returns Combined analysis result in UI format
 */
export async function analyzeImageCombined(file: File): Promise<AnalysisResult> {
  try {
    // Call the browser wrapper which uses Netlify Function
    const result = await analyzeImageMediaAPI(file);
    
    // Convert to UI format
    return convertToAnalysisResult(result, file.name);
  } catch (error) {
    console.error("Combined analysis failed:", error);
    // Return error result
    return {
      score: 0,
      status: "ANALYSIS FAILED",
      color: "red",
      anomalies: [
        {
          title: "Analysis Error",
          description: error instanceof Error ? error.message : "Failed to analyze image",
          severity: "Critical",
        },
      ],
      realityTrace: [{ step: "Error occurred", confidence: 0 }],
      truthScore: {
        risk: "HIGH",
        category: "Analysis Error",
        impact: "Could not analyze the image",
        recommendation: "Please try again or contact support.",
      },
      sourceMatch: {
        template: false,
        online: false,
        format: "Error",
      },
    };
  }
}

/**
 * Convert new analysis result format to UI AnalysisResult format
 */
function convertToAnalysisResult(
  result: NewCombinedResult,
  fileName: string
): AnalysisResult {
  const anomalies: Anomaly[] = [];
  const { metadata, forensic } = result;

  // Add metadata anomalies
  metadata.anomalies.forEach((anomaly) => {
    // Map severity from new format to UI format
    let severity: Severity = "Medium";
    if (anomaly.severity === "high") {
      severity = "High";
    } else if (anomaly.severity === "low") {
      severity = "Low";
    } else if (anomaly.severity === "none") {
      severity = "Good";
    }

    anomalies.push({
      title: "Metadata Analysis",
      description: anomaly.message,
      severity,
    });
  });

  // Add forensic (Gemini) visual observations
  forensic.visual_observations.forEach((obs, index) => {
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
  if (forensic.synth_id_result && forensic.synth_id_result.toLowerCase().includes("watermark")) {
    anomalies.unshift({
      title: "SynthID Watermark Detection",
      description: forensic.synth_id_result,
      severity: "Critical",
    });
  }

  // Calculate final score based on both analyses
  let score: number;
  let status: string;
  let color: "red" | "yellow" | "green";

  // Use Gemini verdict as primary
  if (forensic.overall_verdict === "likely_ai") {
    score = Math.floor((1 - forensic.confidence) * 30) + 10; // 10-40 range
    // Lower score if metadata has high severity anomalies
    if (metadata.anomalies.some(a => a.severity === "high")) {
      score = Math.max(5, score - 10);
    }
    status = "AI-GENERATED CONTENT DETECTED";
    color = "red";
  } else if (forensic.overall_verdict === "likely_real") {
    score = Math.floor(forensic.confidence * 20) + 80; // 80-100 range
    // Only lower score if metadata has high severity anomalies
    if (metadata.anomalies.some(a => a.severity === "high")) {
      score = Math.max(70, score - 10);
    }
    status = "LIKELY AUTHENTIC";
    color = "green";
  } else {
    // uncertain verdict
    score = Math.floor(forensic.confidence * 40) + 40; // 40-80 range
    // Adjust based on metadata
    if (metadata.anomalies.some(a => a.severity === "high")) {
      score = Math.max(30, score - 10);
    }
    status = "UNCERTAIN - REVIEW NEEDED";
    color = "yellow";
  }

  // Special case: If metadata has no EXIF and confidence is low, lower the score significantly
  // This fixes the bug where missing EXIF + uncertain/real Gemini was showing 81%
  if (!metadata.hasExif && metadata.confidence === "low") {
    // When we have no metadata to verify, be much more conservative
    // Reduce score significantly to ensure it's in the uncertain/low range
    if (forensic.overall_verdict === "likely_real") {
      // Even if Gemini says likely_real, without EXIF we should be more cautious
      score = Math.max(50, Math.min(70, score - 25)); // Cap at 50-70 range
      status = "UNCERTAIN - INSUFFICIENT METADATA";
      color = "yellow";
    } else if (forensic.overall_verdict === "uncertain") {
      // Uncertain + no EXIF = definitely uncertain, lower score
      score = Math.max(20, score - 20); // 20-60 range
    } else {
      // likely_ai - already low score, but ensure it stays low
      score = Math.max(10, score - 10);
    }
  }

  // Create reality trace combining both analyses
  const metadataConfidence = metadata.confidence === "high" ? 90 : metadata.confidence === "medium" ? 60 : 30;
  const realityTrace = [
    {
      step: metadata.hasExif ? "EXIF Metadata Extracted" : "No EXIF Data Found",
      confidence: metadata.hasExif ? metadataConfidence : 0,
    },
    {
      step: "AI Visual Analysis Completed",
      confidence: Math.floor(forensic.confidence * 100),
    },
    {
      step: "Combined Assessment",
      confidence: Math.floor((metadataConfidence + forensic.confidence * 100) / 2),
    },
  ];

  // Determine risk and category
  let risk: "HIGH" | "MEDIUM" | "LOW";
  let category: string;
  let impact: string;
  let recommendation: string;

  if (forensic.overall_verdict === "likely_ai") {
    risk = "HIGH";
    category = "AI-Generated Content";
    impact = forensic.explanation;
    recommendation = metadata.anomalies.some(a => a.severity === "high")
      ? "Both AI analysis and metadata checks indicate this content is likely generated. Verify source before trusting."
      : "AI analysis indicates this content is likely generated. Verify source before trusting.";
  } else if (forensic.overall_verdict === "likely_real") {
    risk = metadata.anomalies.some(a => a.severity === "high") ? "MEDIUM" : "LOW";
    category = metadata.anomalies.some(a => a.severity === "high") ? "Metadata Concerns" : "Appears Authentic";
    impact = metadata.anomalies.some(a => a.severity === "high")
      ? "Content appears authentic but metadata shows inconsistencies"
      : forensic.explanation;
    recommendation = metadata.anomalies.some(a => a.severity === "high")
      ? "Content appears authentic but metadata is suspicious. Additional verification recommended."
      : "Content appears authentic based on analysis.";
  } else {
    risk = metadata.anomalies.some(a => a.severity === "high") ? "MEDIUM" : "MEDIUM";
    category = "Insufficient Data";
    impact = forensic.explanation;
    recommendation = metadata.anomalies.some(a => a.severity === "high")
      ? "Analysis is uncertain and metadata is suspicious. Additional verification strongly recommended."
      : "Additional verification recommended.";
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
      template: forensic.synth_id_result && forensic.synth_id_result.includes("watermark")
        ? false
        : metadata.anomalies.some(a => a.severity === "high")
        ? false
        : "N/A",
      online: false,
      format: forensic.overall_verdict === "likely_ai"
        ? "Failed AI detection checks"
        : "Passed basic checks",
    },
  };
}
