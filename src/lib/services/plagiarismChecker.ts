import { extractTextFromInput } from "./textExtractor.js";
import { searchWebForChunk } from "./webSearch.js";
import { scoreChunkAgainstSources } from "./similarityScorer.js";
import { detectAIGeneratedText } from "./aiGeneratedDetector.js";
import type {
  PlagiarismInput,
  PlagiarismReport,
  TextChunk,
  SuspiciousSegment,
  RiskLevel,
  AnalysisStatus,
} from "../types/plagiarism.js";

const CHUNK_SIZE = 1500; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const MAX_CONCURRENT_CHUNKS = 3; // Process max 3 chunks in parallel (reduced from 5 to save memory)
const RATE_LIMIT_DELAY_MS = 100; // Delay between chunk processing (reduced for speed)
const MAX_CHUNKS_TO_PROCESS = 4; // Limit chunks to stay within 8s timeout (free tier limit)

/**
 * Chunk text into overlapping segments for analysis
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

    // Move start index forward, accounting for overlap
    startIndex = endIndex - CHUNK_OVERLAP;

    // Prevent infinite loop if text is shorter than chunk size
    if (startIndex >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Process a single chunk with web search and similarity scoring
 */
async function processChunk(
  chunk: TextChunk
): Promise<{
  segment: SuspiciousSegment | null;
  error?: string;
  unscored?: boolean;
}> {
  try {
    // Search web for this chunk
    const searchResults = await searchWebForChunk(chunk.text);

    // Score chunk against sources
    const scoringResult = await scoreChunkAgainstSources(chunk, searchResults);

    // If chunk is suspicious, create segment
    if (scoringResult.suspicious && scoringResult.matches.length > 0) {
      return {
        segment: {
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          textPreview: chunk.text.slice(0, 50) + "...", // 50 chars preview
          similarityScore: scoringResult.similarityScore,
          sources: scoringResult.matches,
        },
      };
    }

    return { segment: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if this is a critical error
    const isCritical =
      errorMessage.includes("502") ||
      errorMessage.includes("500") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("5xx") ||
      errorMessage.includes("network") ||
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("service error");

    if (isCritical) {
      // Re-throw critical errors
      throw error;
    }

    // For non-critical errors, mark as unscored
    console.error(`Error processing chunk at index ${chunk.startIndex}:`, error);
    return { segment: null, error: errorMessage, unscored: true };
  }
}

/**
 * Process chunks with concurrency control
 */
async function processChunksConcurrently(
  chunks: TextChunk[]
): Promise<{
  segments: SuspiciousSegment[];
  unscoredCount: number;
  errors: string[];
}> {
  const segments: SuspiciousSegment[] = [];
  const errors: string[] = [];
  let unscoredCount = 0;

  // Process chunks in batches of MAX_CONCURRENT_CHUNKS
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    
    const results = await Promise.allSettled(
      batch.map((chunk) => processChunk(chunk))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { segment, error, unscored } = result.value;
        if (segment) {
          segments.push(segment);
        }
        if (unscored) {
          unscoredCount++;
        }
        if (error) {
          errors.push(error);
        }
      } else {
        // Rejected promise - this is a critical error
        throw result.reason;
      }
    }

    // Add delay between batches to avoid rate limits
    if (i + MAX_CONCURRENT_CHUNKS < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }

  return { segments, unscoredCount, errors };
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
  
  // Limit chunks to avoid timeout (free tier has 8s limit)
  const totalChunks = chunks.length;
  const chunksToProcess = chunks.slice(0, MAX_CHUNKS_TO_PROCESS);
  const wasLimited = chunksToProcess.length < totalChunks;

  // Step 3: Process chunks with concurrency control
  let suspiciousSegments: SuspiciousSegment[] = [];
  let unscoredChunks = 0;
  let searchApiFailed = false;
  let analysisStatus: AnalysisStatus = "success";

  try {
    const { segments, unscoredCount, errors } = await processChunksConcurrently(chunksToProcess);
    suspiciousSegments = segments;
    unscoredChunks = unscoredCount;

    if (unscoredCount > 0 || wasLimited) {
      analysisStatus = "partial_success";
    }

    if (errors.length > 0) {
      console.warn(`Some chunks failed to process: ${errors.length} errors`);
    }
  } catch (error) {
    // Critical error occurred
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Preserve error prefixes if they exist
    if (errorMessage.includes("BAD_REQUEST:") || errorMessage.includes("EXTRACTION_ERROR:") || errorMessage.includes("UPSTREAM_ERROR:")) {
      throw error;
    }
    throw new Error(`UPSTREAM_ERROR: Plagiarism analysis failed: ${errorMessage}`);
  }

  // Check if search API is available
  if (!process.env.SEARCH_API_KEY) {
    searchApiFailed = true;
  }

  // Step 4: Compute plagiarism percentage using weighted average
  let plagiarismPercentage = 0;
  if (suspiciousSegments.length > 0) {
    // Calculate weighted average (weight = chunk length)
    let totalWeightedSimilarity = 0;
    let totalWeight = 0;

    for (const segment of suspiciousSegments) {
      const chunkLength = segment.endIndex - segment.startIndex;
      totalWeightedSimilarity += segment.similarityScore * chunkLength;
      totalWeight += chunkLength;
    }

    // Convert to percentage
    if (totalWeight > 0) {
      const avgSimilarity = totalWeightedSimilarity / totalWeight;
      // Scale similarity to percentage (similarity 0.5+ = suspicious)
      plagiarismPercentage = Math.min(100, avgSimilarity * 100);
    }
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
    // Check if this is a critical error
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
      errorMessage.includes("service error") ||
      errorMessage.includes("UPSTREAM_ERROR") ||
      errorMessage.includes("BAD_REQUEST")
    ) {
      // Preserve error prefixes if they exist
      if (errorMessage.includes("UPSTREAM_ERROR") || errorMessage.includes("BAD_REQUEST")) {
        throw error;
      }
      throw new Error(`UPSTREAM_ERROR: AI detection service error: ${errorMessage}`);
    }
    // For non-critical errors, log and use fallback
    console.error("AI detection failed:", error);
    aiDetection = {
      likelihood: 0.5,
      verdict: "uncertain" as const,
    };
    if (analysisStatus === "success") {
      analysisStatus = "partial_success";
    }
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
    searchApiFailed,
    unscoredChunks,
    normalizedTextLength,
    wasLimited,
    totalChunks,
    chunksToProcess.length
  );

  return {
    normalizedTextLength,
    plagiarismPercentage: Math.round(plagiarismPercentage * 10) / 10, // Round to 1 decimal
    riskLevel,
    suspiciousSegments,
    aiGeneratedLikelihood: aiDetection.likelihood,
    aiVerdict: aiDetection.verdict,
    explanation,
    analysisStatus,
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
  searchApiFailed: boolean,
  unscoredChunks: number,
  textLength: number,
  wasLimited?: boolean,
  totalChunks?: number,
  processedChunks?: number
): string {
  const parts: string[] = [];

  if (searchApiFailed) {
    parts.push(
      "Web search API is not configured. Plagiarism detection against public sources was skipped."
    );
  }

  if (wasLimited && totalChunks && processedChunks) {
    parts.push(
      `Note: Document was large (${totalChunks} chunk${totalChunks !== 1 ? "s" : ""}). Analysis was limited to first ${processedChunks} chunk${processedChunks !== 1 ? "s" : ""} to stay within timeout limits. Results are based on a sample of the document.`
    );
  }

  if (unscoredChunks > 0) {
    parts.push(
      `Note: ${unscoredChunks} chunk${unscoredChunks !== 1 ? "s" : ""} could not be analyzed due to service errors. Results may be incomplete.`
    );
  }

  if (textLength > 200_000) {
    parts.push(
      "Note: Text was truncated to 200,000 characters for analysis. Results are based on the first portion of the document."
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
