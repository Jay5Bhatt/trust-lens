import { extractTextFromInput } from "./textExtractor";
import { searchWebForChunk } from "./webSearch";
import { scoreChunkAgainstSources } from "./similarityScorer";
import { detectAIGeneratedText } from "./aiGeneratedDetector";
import type {
  PlagiarismInput,
  PlagiarismReport,
  TextChunk,
  SuspiciousSegment,
  RiskLevel,
} from "../types/plagiarism";

/**
 * Chunk text into overlapping segments for analysis
 */
function chunkText(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const chunkSize = 1400; // Average of 1200-1600
  const overlap = 200;
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunkText = text.slice(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      startIndex,
      endIndex,
    });

    // Move start index forward, accounting for overlap
    startIndex = endIndex - overlap;

    // Prevent infinite loop if text is shorter than chunk size
    if (startIndex >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Main plagiarism checking function
 * Orchestrates text extraction, chunking, web search, similarity scoring, and AI detection
 */
export async function checkPlagiarism(
  input: PlagiarismInput
): Promise<PlagiarismReport> {
  // Step 1: Extract and normalize text
  const fullText = await extractTextFromInput(input);
  const normalizedTextLength = fullText.length;

  // Step 2: Chunk text
  const chunks = chunkText(fullText);

  // Step 3: Run web search and similarity scoring for each chunk
  const suspiciousSegments: SuspiciousSegment[] = [];
  let searchApiFailed = false;
  let criticalSearchError: Error | null = null;
  let criticalScoringError: Error | null = null;

  for (const chunk of chunks) {
    try {
      // Search web for this chunk
      let searchResults: any[] = [];
      try {
        searchResults = await searchWebForChunk(chunk.text);
      } catch (error) {
        // Check if this is a critical error (502, 5xx, network error)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes("502") ||
          errorMessage.includes("500") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504") ||
          errorMessage.includes("5xx") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("SerpAPI") ||
          errorMessage.includes("service error")
        ) {
          criticalSearchError = new Error("Plagiarism analysis failed due to web search service error");
          throw criticalSearchError; // Re-throw to propagate
        }
        // For non-critical errors, log and continue
        console.error(`Web search error for chunk at index ${chunk.startIndex}:`, error);
      }

      if (searchResults.length === 0 && !searchApiFailed) {
        // Check if API key is missing (first time we notice)
        if (!process.env.SEARCH_API_KEY) {
          searchApiFailed = true;
        }
      }

      // Score chunk against sources
      let scoringResult;
      try {
        scoringResult = await scoreChunkAgainstSources(
          chunk,
          searchResults
        );
      } catch (error) {
        // Check if this is a critical error (502, 5xx, network error)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes("502") ||
          errorMessage.includes("500") ||
          errorMessage.includes("503") ||
          errorMessage.includes("504") ||
          errorMessage.includes("5xx") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("service error")
        ) {
          criticalScoringError = new Error("Plagiarism analysis failed due to AI similarity scoring service error");
          throw criticalScoringError; // Re-throw to propagate
        }
        // For non-critical errors, log and continue
        console.error(`Similarity scoring error for chunk at index ${chunk.startIndex}:`, error);
        continue; // Skip this chunk
      }

      // If chunk is suspicious, add to segments
      if (scoringResult.suspicious && scoringResult.matches.length > 0) {
        suspiciousSegments.push({
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          textPreview: chunk.text.slice(0, 200) + "...",
          similarityScore: scoringResult.similarityScore,
          sources: scoringResult.matches,
        });
      }
    } catch (error) {
      // If this is a critical error, propagate it
      if (error === criticalSearchError || error === criticalScoringError) {
        throw error;
      }
      // Otherwise, log and continue with other chunks
      console.error(`Error processing chunk at index ${chunk.startIndex}:`, error);
    }
  }

  // If we had critical errors, throw them now
  if (criticalSearchError) {
    throw criticalSearchError;
  }
  if (criticalScoringError) {
    throw criticalScoringError;
  }

  // Step 4: Compute plagiarism percentage
  let plagiarismPercentage = 0;
  if (suspiciousSegments.length > 0) {
    // Calculate total suspicious character count
    let totalSuspiciousChars = 0;
    for (const segment of suspiciousSegments) {
      totalSuspiciousChars += segment.endIndex - segment.startIndex;
    }
    // Calculate percentage (accounting for overlaps)
    plagiarismPercentage = Math.min(
      100,
      (totalSuspiciousChars / normalizedTextLength) * 100
    );
  }

  // Step 5: Determine risk level
  let riskLevel: RiskLevel;
  if (plagiarismPercentage < 20) {
    riskLevel = "low";
  } else if (plagiarismPercentage < 50) {
    riskLevel = "medium";
  } else {
    riskLevel = "high";
  }

  // Step 6: Run AI detection
  let aiDetection;
  try {
    aiDetection = await detectAIGeneratedText(fullText);
  } catch (error) {
    // Check if this is a critical error (502, 5xx, network error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("502") ||
      errorMessage.includes("500") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("5xx") ||
      errorMessage.includes("network") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("service error")
    ) {
      // If we also had search/scoring errors, combine them
      if (criticalSearchError || criticalScoringError) {
        throw new Error("Plagiarism analysis failed due to upstream service errors");
      }
      throw new Error("Plagiarism analysis failed due to AI detection service error");
    }
    // For non-critical errors, log and use fallback
    console.error("AI detection failed:", error);
    aiDetection = {
      likelihood: 0.5,
      verdict: "uncertain" as const,
    };
  }

  // Adjust risk level based on AI detection if needed
  if (aiDetection.verdict === "likely_ai" && aiDetection.likelihood > 0.7) {
    // If AI-generated and high likelihood, increase risk
    if (riskLevel === "low") {
      riskLevel = "medium";
    } else if (riskLevel === "medium") {
      riskLevel = "high";
    }
  }

  // Step 7: Generate explanation
  const explanation = generateExplanation(
    plagiarismPercentage,
    riskLevel,
    suspiciousSegments.length,
    aiDetection,
    searchApiFailed
  );

  return {
    normalizedTextLength,
    plagiarismPercentage: Math.round(plagiarismPercentage * 10) / 10, // Round to 1 decimal
    riskLevel,
    suspiciousSegments,
    aiGeneratedLikelihood: aiDetection.likelihood,
    aiVerdict: aiDetection.verdict,
    explanation,
  };
}

/**
 * Generate human-readable explanation of the results
 */
function generateExplanation(
  plagiarismPercentage: number,
  riskLevel: RiskLevel,
  suspiciousSegmentCount: number,
  aiDetection: { likelihood: number; verdict: string },
  searchApiFailed: boolean
): string {
  const parts: string[] = [];

  if (searchApiFailed) {
    parts.push(
      "Web search API is not configured. Plagiarism detection against public sources was skipped."
    );
  }

  if (plagiarismPercentage === 0) {
    parts.push("No significant plagiarism detected against public web sources.");
  } else {
    parts.push(
      `Found ${suspiciousSegmentCount} suspicious segment${suspiciousSegmentCount !== 1 ? "s" : ""} with ${plagiarismPercentage.toFixed(1)}% of the text potentially plagiarized.`
    );
  }

  if (aiDetection.verdict === "likely_ai") {
    parts.push(
      `AI-generated text detection indicates this text is likely AI-generated (${(aiDetection.likelihood * 100).toFixed(0)}% confidence).`
    );
  } else if (aiDetection.verdict === "likely_human") {
    parts.push(
      `AI-generated text detection indicates this text is likely human-written (${((1 - aiDetection.likelihood) * 100).toFixed(0)}% confidence).`
    );
  } else {
    parts.push(
      "AI-generated text detection was unable to determine with confidence whether this text is human or AI-generated."
    );
  }

  parts.push(`Overall risk level: ${riskLevel.toUpperCase()}.`);

  return parts.join(" ");
}

