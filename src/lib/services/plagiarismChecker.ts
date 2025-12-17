import type {
  PlagiarismInput,
  PlagiarismReport,
  TextChunk,
  SuspiciousSegment,
  RiskLevel,
  AnalysisStatus,
  AIVerdict,
} from "../types/plagiarism.js";
import { extractTextFromInput } from "./textExtractor.js";
import { searchWebForChunk } from "./webSearch.js";
import { scoreChunkAgainstSources } from "./similarityScorer.js";
import { detectAIGeneratedText } from "./aiGeneratedDetector.js";

// Constants for chunking and processing
const CHUNK_SIZE = 1500; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const MAX_CONCURRENT_CHUNKS = 3; // Process max 3 chunks in parallel (reduced for memory)
const RATE_LIMIT_DELAY_MS = 100; // Delay between chunk processing (reduced for speed)
const MAX_CHUNKS_TO_PROCESS = 4; // Limit chunks to stay within 8s timeout (free tier limit)

/**
 * Split text into overlapping chunks with start/end indices
 */
function chunkText(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
    const chunkText = text.slice(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      startIndex,
      endIndex,
    });

    // Move to next chunk with overlap
    startIndex += CHUNK_SIZE - CHUNK_OVERLAP;

    // Prevent infinite loop if chunk size is too small
    if (endIndex === startIndex) {
      break;
    }
  }

  return chunks;
}

/**
 * Calculate plagiarism percentage from suspicious segments
 */
function calculatePlagiarismPercentage(
  textLength: number,
  suspiciousSegments: SuspiciousSegment[]
): number {
  if (textLength === 0 || suspiciousSegments.length === 0) {
    return 0;
  }

  // Calculate total suspicious character count (accounting for overlaps)
  let totalSuspiciousChars = 0;
  const sortedSegments = [...suspiciousSegments].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  // Merge overlapping segments
  if (sortedSegments.length > 0) {
    let currentStart = sortedSegments[0].startIndex;
    let currentEnd = sortedSegments[0].endIndex;

    for (let i = 1; i < sortedSegments.length; i++) {
      const segment = sortedSegments[i];
      if (segment.startIndex <= currentEnd) {
        // Overlapping or adjacent segments - extend current range
        currentEnd = Math.max(currentEnd, segment.endIndex);
      } else {
        // Non-overlapping segment - add previous range and start new one
        totalSuspiciousChars += currentEnd - currentStart;
        currentStart = segment.startIndex;
        currentEnd = segment.endIndex;
      }
    }
    // Add final range
    totalSuspiciousChars += currentEnd - currentStart;
  }

  // Calculate percentage
  const percentage = (totalSuspiciousChars / textLength) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Determine risk level based on plagiarism percentage and AI likelihood
 */
function determineRiskLevel(
  plagiarismPercentage: number,
  aiLikelihood: number
): RiskLevel {
  // Combine plagiarism and AI scores for risk assessment
  const combinedScore = plagiarismPercentage * 0.6 + aiLikelihood * 100 * 0.4;

  if (combinedScore >= 60) {
    return "high";
  } else if (combinedScore >= 30) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Generate human-readable explanation of the analysis results
 */
function generateExplanation(
  plagiarismPercentage: number,
  suspiciousSegments: SuspiciousSegment[],
  aiLikelihood: number,
  aiVerdict: AIVerdict,
  riskLevel: RiskLevel,
  textLength: number,
  wasLimited?: boolean,
  totalChunks?: number,
  processedChunks?: number,
  hadUpstreamIssues?: boolean
): string {
  const parts: string[] = [];

  // Plagiarism analysis summary
  if (suspiciousSegments.length > 0) {
    parts.push(
      `Found ${suspiciousSegments.length} suspicious segment${
        suspiciousSegments.length !== 1 ? "s" : ""
      } with ${plagiarismPercentage.toFixed(1)}% of the text potentially plagiarized.`
    );
  } else {
    parts.push(
      `No suspicious segments found. Plagiarism percentage: ${plagiarismPercentage.toFixed(1)}%.`
    );
  }

  // AI detection summary
  const aiVerdictText =
    aiVerdict === "likely_ai"
      ? "likely AI-generated"
      : aiVerdict === "likely_human"
        ? "likely human-written"
        : "uncertain (could be AI or human)";
  parts.push(
    `AI-generated text detection indicates this text is ${aiVerdictText} (${(aiLikelihood * 100).toFixed(0)}% confidence).`
  );

  // Risk level
  parts.push(`Overall risk level: ${riskLevel.toUpperCase()}.`);

  // Note if analysis was limited
  if (wasLimited && totalChunks && processedChunks) {
    parts.push(
      `Note: Document was large (${totalChunks} chunk${
        totalChunks !== 1 ? "s" : ""
      }). Analysis was limited to first ${processedChunks} chunk${
        processedChunks !== 1 ? "s" : ""
      } to stay within timeout limits. Results are based on a sample of the document.`
    );
  }

  if (hadUpstreamIssues) {
    parts.push(
      "Web search service was unavailable during analysis, so plagiarism matching may be limited. Try again later or use the demo example."
    );
  }

  return parts.join(" ");
}

/**
 * Process chunks concurrently with rate limiting and error handling
 */
async function processChunksConcurrently(
  chunks: TextChunk[]
): Promise<{
  segments: SuspiciousSegment[];
  unscoredCount: number;
  errors: Error[];
}> {
  const segments: SuspiciousSegment[] = [];
  const errors: Error[] = [];
  let unscoredCount = 0;

  // Process chunks in batches to respect concurrency limits
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);

    // Process batch in parallel
    const batchPromises = batch.map(async (chunk) => {
      try {
        // Search web for this chunk
        const searchResults = await searchWebForChunk(chunk.text);

        // Score chunk against sources
        const { suspicious, similarityScore, matches } =
          await scoreChunkAgainstSources(chunk, searchResults);

        // If suspicious, create a segment
        if (suspicious && matches.length > 0) {
          // Get preview text (first 100 chars)
          const preview = chunk.text.slice(0, 100).trim();

          segments.push({
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            textPreview: preview,
            similarityScore,
            sources: matches,
          });
        }

        return { success: true };
      } catch (error) {
        // Log error but continue processing other chunks
        const err =
          error instanceof Error
            ? error
            : new Error(String(error || "Unknown error"));
        errors.push(err);
        console.error(`Error processing chunk at index ${chunk.startIndex}:`, err);

        // Check if it's a critical error that should stop processing
        const errorMessage = err.message;
        const isUpstreamWarning = errorMessage.includes("UPSTREAM_WARNING");
        if (
          errorMessage.includes("BAD_REQUEST") ||
          errorMessage.includes("UPSTREAM_ERROR")
        ) {
          // Re-throw critical errors to stop processing
          throw err;
        }

        // Non-critical error - continue but count as unscored
        if (!isUpstreamWarning) {
          unscoredCount++;
        }
        return { success: false };
      }
    });

    // Wait for batch to complete
    await Promise.all(batchPromises);

    // Rate limit delay between batches (except for last batch)
    if (i + MAX_CONCURRENT_CHUNKS < chunks.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY_MS)
      );
    }
  }

  // Sort segments by start index
  segments.sort((a, b) => a.startIndex - b.startIndex);

  return { segments, unscoredCount, errors };
}

/**
 * Main plagiarism checking function
 * Analyzes text for plagiarism and AI generation
 */
export async function checkPlagiarism(
  input: PlagiarismInput
): Promise<PlagiarismReport> {
  // Extract and normalize text
  let fullText: string;
  try {
    fullText = await extractTextFromInput(input);
  } catch (error) {
    // Re-throw extraction errors with proper prefix
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("BAD_REQUEST") ||
      errorMessage.includes("EXTRACTION_ERROR")
    ) {
      throw error; // Already has proper prefix
    }
    throw new Error(`EXTRACTION_ERROR: ${errorMessage}`);
  }

  const textLength = fullText.length;

  // Chunk the text
  const chunks = chunkText(fullText);
  const totalChunks = chunks.length;
  const chunksToProcess = chunks.slice(0, MAX_CHUNKS_TO_PROCESS);
  const wasLimited = chunksToProcess.length < totalChunks;

  // Process chunks (with concurrency limits)
  let segments: SuspiciousSegment[] = [];
  let unscoredCount = 0;
  let upstreamErrors: Error[] = [];
  let analysisStatus: AnalysisStatus = "success";

  try {
    const result = await processChunksConcurrently(chunksToProcess);
    segments = result.segments;
    unscoredCount = result.unscoredCount;
    upstreamErrors = result.errors;

    if (unscoredCount > 0 || wasLimited || upstreamErrors.length > 0) {
      analysisStatus = "partial_success";
    }
  } catch (error) {
    // Critical error during processing - mark as partial success if we have some results
    if (segments.length > 0) {
      analysisStatus = "partial_success";
    } else {
      analysisStatus = "error";
      // Re-throw critical errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`UPSTREAM_ERROR: ${errorMessage}`);
    }
  }

  // Detect AI generation
  let aiLikelihood = 0.5;
  let aiVerdict: AIVerdict = "uncertain";

  try {
    const aiResult = await detectAIGeneratedText(fullText);
    aiLikelihood = aiResult.likelihood;
    aiVerdict = aiResult.verdict;
  } catch (error) {
    // AI detection failed - use defaults but don't fail the entire analysis
    console.error("AI detection failed, using defaults:", error);
    aiLikelihood = 0.5;
    aiVerdict = "uncertain";
    if (analysisStatus === "success") {
      analysisStatus = "partial_success";
    }
  }

  // Calculate plagiarism percentage
  const plagiarismPercentage = calculatePlagiarismPercentage(
    textLength,
    segments
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(plagiarismPercentage, aiLikelihood);

  // Generate explanation
  const explanation = generateExplanation(
    plagiarismPercentage,
    segments,
    aiLikelihood,
    aiVerdict,
    riskLevel,
    textLength,
    wasLimited,
    totalChunks,
    chunksToProcess.length,
    upstreamErrors.some((err) =>
      (err?.message || "").includes("UPSTREAM_WARNING") ||
      (err?.message || "").includes("UPSTREAM_ERROR")
    )
  );

  // Return structured report
  return {
    normalizedTextLength: textLength,
    plagiarismPercentage,
    riskLevel,
    suspiciousSegments: segments,
    aiGeneratedLikelihood: aiLikelihood,
    aiVerdict,
    explanation,
    analysisStatus,
  };
}