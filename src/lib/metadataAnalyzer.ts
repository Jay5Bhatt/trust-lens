import exifr from "exifr";
import type { MetadataAnalysis, MetadataAnomalySeverity } from "./types/media-analysis";

/**
 * Analyze EXIF metadata from image data
 * @param input - Image as Buffer or base64 string
 * @returns Metadata analysis result
 */
export async function analyzeMetadata(input: Buffer | string): Promise<MetadataAnalysis> {
  try {
    // Normalize input to Buffer
    let imageBuffer: Buffer;
    
    if (Buffer.isBuffer(input)) {
      imageBuffer = input;
    } else if (typeof input === "string") {
      // Handle base64 string (with or without data URL prefix)
      const base64Match = input.match(/^data:[\w\/]+;base64,(.+)$/);
      const base64Data = base64Match ? base64Match[1] : input;
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      throw new Error("Invalid input format. Expected Buffer or string (base64).");
    }

    // Extract EXIF data using exifr
    const exifData = await exifr.parse(imageBuffer, {
      // Extract common fields
      pick: [
        "Make",
        "Model",
        "DateTime",
        "DateTimeOriginal",
        "Software",
        "Orientation",
        "ImageWidth",
        "ImageHeight",
        "GPSLatitude",
        "GPSLongitude",
        "Compression",
      ],
      // Get all tags for rawExif
      translateKeys: false,
      translateValues: false,
    });

    // Check if EXIF data exists
    if (!exifData || Object.keys(exifData).length === 0) {
      // No EXIF data found
      return {
        hasExif: false,
        rawExif: null,
        anomalies: [
          {
            code: "NO_EXIF",
            severity: "low",
            message: "No EXIF metadata found – common for screenshots and processed/forwarded images.",
          },
        ],
        confidence: "low",
      };
    }

    // EXIF data exists - analyze for anomalies
    const anomalies: MetadataAnalysis["anomalies"] = [];
    
    // Check for suspicious software
    if (exifData.Software) {
      const software = String(exifData.Software).toLowerCase();
      if (
        software.includes("ai") ||
        software.includes("generated") ||
        software.includes("midjourney") ||
        software.includes("dall-e") ||
        software.includes("stable diffusion")
      ) {
        anomalies.push({
          code: "SUSPICIOUS_SOFTWARE",
          severity: "high",
          message: `Suspicious software detected: ${exifData.Software}`,
        });
      }
    }

    // Check for missing critical metadata (if EXIF exists but key fields are missing)
    if (!exifData.Make && !exifData.Model) {
      anomalies.push({
        code: "PARTIAL_EXIF",
        severity: "low",
        message: "EXIF data present but missing camera make/model information.",
      });
    }

    if (!exifData.DateTimeOriginal && !exifData.DateTime) {
      anomalies.push({
        code: "PARTIAL_EXIF",
        severity: "low",
        message: "EXIF data present but missing date/time information.",
      });
    }

    // Determine confidence based on anomalies
    let confidence: "low" | "medium" | "high" = "high";
    if (anomalies.some(a => a.severity === "high")) {
      confidence = "medium";
    } else if (anomalies.length > 0) {
      confidence = "medium";
    }

    return {
      hasExif: true,
      rawExif: exifData,
      anomalies,
      confidence,
    };
  } catch (error) {
    // Error reading EXIF - treat as no EXIF
    console.error("Metadata analysis error:", error);
    return {
      hasExif: false,
      rawExif: null,
      anomalies: [
        {
          code: "EXIF_READ_ERROR",
          severity: "low",
          message: "Failed to read EXIF metadata from image.",
        },
      ],
      confidence: "low",
    };
  }
}

