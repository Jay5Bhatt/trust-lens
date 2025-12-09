/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry (should return a Promise)
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 500)
 * @param maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns Promise that resolves with the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if error is retryable (network errors, 5xx, timeouts)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable =
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("502") ||
        errorMessage.includes("500") ||
        errorMessage.includes("503") ||
        errorMessage.includes("504") ||
        errorMessage.includes("429") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("ETIMEDOUT");

      if (!isRetryable) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${finalDelay.toFixed(0)}ms:`, errorMessage);
      
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}
