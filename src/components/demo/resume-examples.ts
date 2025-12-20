import type { ResumeVerificationResult } from "./resume-types";

/**
 * Predefined demo data for example resume analysis
 * This works offline and requires no external APIs
 */
export function getExampleResumeResult(): ResumeVerificationResult {
  return {
    summary: {
      hiringRisk: "MEDIUM",
      confidence: "HIGH",
      recommendation: "Manual verification advised",
    },
    detectionSignals: {
      aiGeneratedContent: {
        likelihood: 64,
        explanation: "Detected linguistic uniformity, repetitive phrasing, and generic skill descriptions.",
      },
      employmentTimeline: {
        coherent: false,
        explanation: "Overlapping employment dates detected between roles.",
      },
      credentialVerification: {
        verified: false,
        explanation: "One or more credentials could not be verified against known institutional patterns.",
      },
    },
    explainability: [
      {
        signal: "AI-Generated Content Likelihood",
        what: "The resume shows 64% likelihood of AI-generated content based on linguistic analysis. Detected patterns include uniform sentence structures, repetitive phrasing patterns, and generic skill descriptions that are commonly found in AI-generated resumes.",
        why: "AI-generated content in resumes can indicate that the candidate may lack genuine experience or is attempting to inflate qualifications. This pattern suggests the resume may have been mass-produced or heavily templated rather than authentically written.",
        riskImpact: "Increases hiring risk because it raises questions about the candidate's authenticity and genuine qualifications. Employers need to verify that skills and experiences are real and verifiable, not artificially generated.",
      },
      {
        signal: "Employment Timeline Coherence",
        what: "Analysis detected overlapping employment dates between different roles. Specifically, employment periods show temporal inconsistencies where multiple full-time positions appear to have occurred simultaneously without explanation.",
        why: "Overlapping employment dates are a red flag for resume fraud. Legitimate employment histories should have clear, non-overlapping periods unless explicitly explained (e.g., consulting work, part-time roles). Unexplained overlaps suggest fabricated work history.",
        riskImpact: "This significantly increases hiring risk as it indicates potential falsification of work experience. Employers cannot trust the accuracy of the employment history, which is critical for role-fit assessment and background verification.",
      },
      {
        signal: "Credential Verification",
        what: "One or more listed credentials (degrees, certifications, or professional qualifications) could not be verified against known institutional patterns, formatting standards, or verification databases.",
        why: "Unverifiable credentials suggest either falsified qualifications or institutions that may not exist or be accredited. Legitimate credentials should match standard verification patterns and be traceable through official channels.",
        riskImpact: "High hiring risk because credentials are fundamental to qualification assessment. Unverifiable credentials mean the candidate's core qualifications cannot be confirmed, potentially leading to hiring unqualified candidates or legal/compliance issues.",
      },
    ],
  };
}


