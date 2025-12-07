import EXIF from "exif-js";

/**
 * EXIF metadata analysis result
 */
export interface ExifAnalysisResult {
  hasExif: boolean;
  anomalies: string[];
  metadata: {
    camera?: string;
    date?: string;
    location?: string;
    software?: string;
    compression?: string;
  };
  suspicious: boolean;
  confidence: number;
}

/**
 * Analyze EXIF metadata from an image file
 * @param file - Image file to analyze
 * @returns EXIF analysis result
 */
export async function analyzeExifMetadata(file: File): Promise<ExifAnalysisResult> {
  return new Promise((resolve) => {
    const anomalies: string[] = [];
    const metadata: ExifAnalysisResult["metadata"] = {};

    // Create an image element to load the file (exif-js requires an image element)
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function() {
      try {
        // Now that image is loaded, extract EXIF data
        EXIF.getData(img, function() {
          try {
            // Check if EXIF data exists
            const allTags = EXIF.getAllTags(this);
            const hasExif = allTags && Object.keys(allTags).length > 0;

            if (!hasExif) {
              URL.revokeObjectURL(url);
              anomalies.push("No EXIF metadata found - common for screenshots and processed images");
              resolve({
                hasExif: false,
                anomalies,
                metadata: {},
                suspicious: false, // Missing EXIF alone is not suspicious - it's very common
                confidence: 0.7, // Slightly lower confidence but not suspicious
              });
              return;
            }

            // Extract camera information
            const make = EXIF.getTag(this, "Make");
            const model = EXIF.getTag(this, "Model");
            if (make || model) {
              metadata.camera = [make, model].filter(Boolean).join(" ");
            }

            // Extract date
            const dateTime = EXIF.getTag(this, "DateTime");
            const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
            if (dateTimeOriginal) {
              metadata.date = dateTimeOriginal;
            } else if (dateTime) {
              metadata.date = dateTime;
            }

            // Extract software
            const software = EXIF.getTag(this, "Software");
            if (software) {
              metadata.software = software;
              // Check for suspicious software (AI generators, editors)
              const lowerSoftware = software.toLowerCase();
              if (
                lowerSoftware.includes("ai") ||
                lowerSoftware.includes("generated") ||
                lowerSoftware.includes("midjourney") ||
                lowerSoftware.includes("dall-e") ||
                lowerSoftware.includes("stable diffusion") ||
                lowerSoftware.includes("photoshop") ||
                lowerSoftware.includes("gimp") ||
                lowerSoftware.includes("editor")
              ) {
                anomalies.push(`Suspicious software detected: ${software}`);
              }
            }

            // Extract compression
            const compression = EXIF.getTag(this, "Compression");
            if (compression) {
              metadata.compression = compression.toString();
            }

            // Note missing metadata but don't treat as anomalies (common for processed images)
            // Only add as informational if we have some EXIF but missing these specific fields
            // (If we have EXIF data, we can note missing fields, but it's not necessarily suspicious)

            // Check for location data
            const latitude = EXIF.getTag(this, "GPSLatitude");
            const longitude = EXIF.getTag(this, "GPSLongitude");
            if (latitude && longitude) {
              metadata.location = `GPS: ${latitude}, ${longitude}`;
            }

            // Determine if suspicious - only mark as suspicious if there are actual red flags
            // Missing camera/date alone is not suspicious (common for processed images)
            // Only suspicious if there's suspicious software or other actual indicators
            const hasSuspiciousSoftware = anomalies.some(a => a.toLowerCase().includes("suspicious software"));
            const suspicious = hasSuspiciousSoftware || anomalies.some(a => 
              a.toLowerCase().includes("suspicious") && !a.toLowerCase().includes("no exif") && !a.toLowerCase().includes("missing")
            );

            // Calculate confidence (higher if has complete metadata, lower if anomalies)
            let confidence = 0.8;
            if (!metadata.camera) confidence -= 0.2;
            if (!metadata.date) confidence -= 0.2;
            if (anomalies.length > 0) confidence -= anomalies.length * 0.1;
            confidence = Math.max(0.1, Math.min(1.0, confidence));

            URL.revokeObjectURL(url);
            resolve({
              hasExif: true,
              anomalies,
              metadata,
              suspicious,
              confidence,
            });
          } catch (error) {
            URL.revokeObjectURL(url);
            console.error("EXIF analysis error:", error);
            resolve({
              hasExif: false,
              anomalies: ["Failed to read EXIF metadata"],
              metadata: {},
              suspicious: true,
              confidence: 0.5,
            });
          }
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        console.error("EXIF getData error:", error);
        resolve({
          hasExif: false,
          anomalies: ["Failed to extract EXIF data"],
          metadata: {},
          suspicious: true,
          confidence: 0.5,
        });
      }
    };

    img.onerror = function() {
      URL.revokeObjectURL(url);
      resolve({
        hasExif: false,
        anomalies: ["Failed to load image for EXIF analysis"],
        metadata: {},
        suspicious: true,
        confidence: 0.5,
      });
    };

    // Start loading the image
    img.src = url;
  });
}

