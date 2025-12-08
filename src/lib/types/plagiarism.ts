export type PlagiarismInput = {
  text?: string;
  fileBuffer?: Buffer;
  fileName?: string;
};

export type SourceMatch = {
  url: string;
  title?: string;
  snippet?: string;
  similarityScore: number;
};

export type SuspiciousSegment = {
  startIndex: number;
  endIndex: number;
  textPreview: string;
  similarityScore: number;
  sources: SourceMatch[];
};

export type RiskLevel = "low" | "medium" | "high";

export type AIVerdict = "likely_ai" | "likely_human" | "uncertain";

export type AIDetectionResult = {
  likelihood: number;
  verdict: AIVerdict;
};

export type PlagiarismReport = {
  normalizedTextLength: number;
  plagiarismPercentage: number;
  riskLevel: RiskLevel;
  suspiciousSegments: SuspiciousSegment[];
  aiGeneratedLikelihood: number;
  aiVerdict: AIVerdict;
  explanation: string;
};

export type TextChunk = {
  text: string;
  startIndex: number;
  endIndex: number;
};

export type WebSearchResult = {
  url: string;
  title?: string;
  snippet?: string;
};

