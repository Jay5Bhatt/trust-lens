import { describe, it, expect } from "vitest";

// Import chunking logic (we'll need to export it or test it indirectly)
// For now, test the logic directly

function chunkText(text: string, chunkSize: number = 1500, overlap: number = 200): Array<{text: string, startIndex: number, endIndex: number}> {
  const chunks: Array<{text: string, startIndex: number, endIndex: number}> = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunkText = text.slice(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      startIndex,
      endIndex,
    });

    startIndex = endIndex - overlap;

    if (startIndex >= text.length) {
      break;
    }
  }

  return chunks;
}

describe("chunkText", () => {
  it("should chunk text correctly", () => {
    const text = "A".repeat(5000);
    const chunks = chunkText(text, 1500, 200);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].startIndex).toBe(0);
    expect(chunks[0].text.length).toBeLessThanOrEqual(1500);
  });

  it("should create overlapping chunks", () => {
    const text = "A".repeat(3000);
    const chunks = chunkText(text, 1500, 200);
    
    if (chunks.length > 1) {
      // Second chunk should start before first chunk ends (overlap)
      expect(chunks[1].startIndex).toBeLessThan(chunks[0].endIndex);
    }
  });

  it("should handle short text", () => {
    const text = "A".repeat(100);
    const chunks = chunkText(text, 1500, 200);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
  });

  it("should cover entire text", () => {
    const text = "A".repeat(5000);
    const chunks = chunkText(text, 1500, 200);
    
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.endIndex).toBe(text.length);
  });
});





