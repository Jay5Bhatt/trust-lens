import { randomUUID } from "uuid";

/**
 * Mask sensitive data in strings (API keys, tokens, etc.)
 */
function maskSensitiveData(text: string): string {
  // Mask API keys (common patterns)
  return text
    .replace(/api[_-]?key["\s:=]+([a-zA-Z0-9_-]{20,})/gi, 'api_key="***MASKED***"')
    .replace(/["']?([a-zA-Z0-9_-]{32,})["']?/g, (match) => {
      // Mask long strings that might be tokens/keys
      if (match.length > 40) {
        return "***MASKED***";
      }
      return match;
    });
}

/**
 * Structured logger with correlation IDs
 */
export class Logger {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || randomUUID();
  }

  /**
   * Get the correlation ID
   */
  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    const logData = {
      level: "info",
      correlationId: this.correlationId,
      message,
      ...(data && { data: this.sanitizeData(data) }),
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(logData));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, data?: any): void {
    const logData: any = {
      level: "error",
      correlationId: this.correlationId,
      message,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      logData.error = { message: String(error) };
    }

    if (data) {
      logData.data = this.sanitizeData(data);
    }

    console.error(JSON.stringify(logData));
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    const logData = {
      level: "warn",
      correlationId: this.correlationId,
      message,
      ...(data && { data: this.sanitizeData(data) }),
      timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(logData));
  }

  /**
   * Sanitize data before logging (remove sensitive info)
   */
  private sanitizeData(data: any): any {
    if (typeof data === "string") {
      return maskSensitiveData(data);
    }
    if (typeof data === "object" && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret")) {
          sanitized[key] = "***MASKED***";
        } else if (typeof value === "string" && value.length > 1000) {
          sanitized[key] = value.slice(0, 100) + "... (truncated)";
        } else if (typeof value === "object") {
          sanitized[key] = this.sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return data;
  }
}
