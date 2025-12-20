export type HiringRisk = "HIGH" | "MEDIUM" | "LOW";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type ResumeVerificationSummary = {
  hiringRisk: HiringRisk;
  confidence: ConfidenceLevel;
  recommendation: string;
};

export type AIGeneratedContentSignal = {
  likelihood: number; // 0-100
  explanation: string;
};

export type EmploymentTimelineSignal = {
  coherent: boolean;
  explanation: string;
};

export type CredentialVerificationSignal = {
  verified: boolean;
  explanation: string;
};

export type DetectionSignals = {
  aiGeneratedContent: AIGeneratedContentSignal;
  employmentTimeline: EmploymentTimelineSignal;
  credentialVerification: CredentialVerificationSignal;
};

export type ExplainabilityItem = {
  signal: string;
  what: string;
  why: string;
  riskImpact: string;
};

export type ResumeVerificationResult = {
  summary: ResumeVerificationSummary;
  detectionSignals: DetectionSignals;
  explainability: ExplainabilityItem[];
};


