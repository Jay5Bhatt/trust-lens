import { describe, it, expect } from "vitest";

/**
 * Integration test for plagiarism API endpoint
 * This test requires the API to be running (use test:integration script)
 */
describe("Plagiarism API Integration", () => {
  const API_URL = process.env.API_URL || "http://localhost:3000";

  it("should return success response for text input", async () => {
    const testText = "This is a test text to check plagiarism detection. " +
      "It contains enough characters to pass validation requirements. " +
      "The system should analyze this text and return a proper response.";

    const response = await fetch(`${API_URL}/api/check-plagiarism`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: testText,
      }),
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("normalizedTextLength");
    expect(data.data).toHaveProperty("plagiarismPercentage");
    expect(data.data).toHaveProperty("riskLevel");
    expect(data.data).toHaveProperty("suspiciousSegments");
    expect(data.data).toHaveProperty("aiGeneratedLikelihood");
    expect(data.data).toHaveProperty("aiVerdict");
    expect(data.data).toHaveProperty("explanation");
    
    // Validate types
    expect(typeof data.data.normalizedTextLength).toBe("number");
    expect(typeof data.data.plagiarismPercentage).toBe("number");
    expect(["low", "medium", "high"]).toContain(data.data.riskLevel);
    expect(Array.isArray(data.data.suspiciousSegments)).toBe(true);
    expect(typeof data.data.aiGeneratedLikelihood).toBe("number");
    expect(["likely_ai", "likely_human", "uncertain"]).toContain(data.data.aiVerdict);
  });

  it("should return error response for empty input", async () => {
    const response = await fetch(`${API_URL}/api/check-plagiarism`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(false);
    expect(data).toHaveProperty("errorType");
    expect(data).toHaveProperty("message");
    expect(["bad_request", "extraction_error"]).toContain(data.errorType);
  });

  it("should return error response for text too short", async () => {
    const response = await fetch(`${API_URL}/api/check-plagiarism`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Short",
      }),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(false);
    expect(data.errorType).toBe("extraction_error");
  });
});

