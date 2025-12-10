import { describe, it, expect } from "vitest";
import { normalizeText } from "../../src/lib/services/textExtractor";

describe("normalizeText", () => {
  it("should normalize text correctly", () => {
    const input = "  Hello   World  \n\n\nTest  ";
    const result = normalizeText(input);
    expect(result).toBe("Hello World\n\nTest");
  });

  it("should remove null bytes", () => {
    const input = "Hello\x00World\x00Test";
    const result = normalizeText(input);
    expect(result).not.toContain("\x00");
  });

  it("should remove excessive whitespace", () => {
    const input = "Hello    World\t\tTest";
    const result = normalizeText(input);
    expect(result).toBe("Hello World Test");
  });

  it("should collapse multiple newlines", () => {
    const input = "Line1\n\n\n\nLine2";
    const result = normalizeText(input);
    expect(result).toBe("Line1\n\nLine2");
  });

  it("should throw error for text shorter than 50 characters", () => {
    const input = "Short";
    expect(() => normalizeText(input)).toThrow("too short");
  });

  it("should handle text with 50+ characters", () => {
    const input = "This is a test string that is longer than fifty characters to pass validation.";
    const result = normalizeText(input);
    expect(result.length).toBeGreaterThanOrEqual(50);
  });

  it("should preserve language characters", () => {
    const input = "Hello 世界 Bonjour مرحبا";
    const result = normalizeText(input);
    expect(result).toContain("世界");
    expect(result).toContain("مرحبا");
  });

  it("should truncate text longer than 200k characters", () => {
    const longText = "A".repeat(250_000);
    const result = normalizeText(longText);
    expect(result.length).toBeLessThanOrEqual(200_000);
  });
});




