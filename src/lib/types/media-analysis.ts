/**
 * Type definitions for media analysis system
 */

export type MetadataAnomalySeverity = "none" | "low" | "medium" | "high";

export interface MetadataAnalysis {
  hasExif: boolean;
  rawExif: Record<string, any> | null;
  anomalies: {
    code: string;           // e.g. "NO_EXIF", "PARTIAL_EXIF"
    severity: MetadataAnomalySeverity;
    message: string;        // human friendly text
  }[];
  confidence: "low" | "medium" | "high";
}

export type ForensicVerdict = "likely_ai" | "likely_real" | "uncertain";

export interface GeminiForensicAnalysis {
  synth_id_result: string;
  visual_observations: string[];
  overall_verdict: ForensicVerdict;
  confidence: number;        // 0–1
  explanation: string;
}

export interface CombinedAnalysisResult {
  metadata: MetadataAnalysis;
  forensic: GeminiForensicAnalysis;
}

