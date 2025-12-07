import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";
import { UploadArea } from "./demo/UploadArea";
import { AnalysisAnimation } from "./demo/AnalysisAnimation";
import { ResultsDashboard } from "./demo/ResultsDashboard";
import { EmptyState } from "./demo/EmptyState";
import { exampleResults, type AnalysisResult, type Anomaly, type Severity } from "./demo/types";
import { analyzeImageAPI, type AnalysisResult as GeminiResult } from "@/lib/gemini-analysis";

type DemoState = "idle" | "analyzing" | "results";

export function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [state, setState] = useState<DemoState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const analysisReadyRef = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Convert Gemini API result to UI AnalysisResult format
   */
  const convertGeminiResult = useCallback((geminiResult: GeminiResult, fileName: string): AnalysisResult => {
    // Map overall_verdict to score, status, and color
    let score: number;
    let status: string;
    let color: "red" | "yellow" | "green";
    
    if (geminiResult.overall_verdict === "likely_ai") {
      score = Math.floor((1 - geminiResult.confidence) * 30) + 10; // 10-40 range
      status = "AI-GENERATED CONTENT DETECTED";
      color = "red";
    } else if (geminiResult.overall_verdict === "likely_real") {
      score = Math.floor(geminiResult.confidence * 20) + 80; // 80-100 range
      status = "LIKELY AUTHENTIC";
      color = "green";
    } else {
      score = Math.floor(geminiResult.confidence * 40) + 40; // 40-80 range
      status = "UNCERTAIN - REVIEW NEEDED";
      color = "yellow";
    }

    // Convert visual_observations to Anomaly format
    const anomalies: Anomaly[] = geminiResult.visual_observations.map((obs, index) => {
      // Determine severity based on verdict and observation content
      let severity: Severity = "Medium";
      const lowerObs = obs.toLowerCase();
      
      if (lowerObs.includes("critical") || lowerObs.includes("artifact") || lowerObs.includes("manipulation")) {
        severity = "Critical";
      } else if (lowerObs.includes("high") || lowerObs.includes("inconsistency") || lowerObs.includes("mismatch")) {
        severity = "High";
      } else if (lowerObs.includes("good") || lowerObs.includes("authentic") || lowerObs.includes("genuine")) {
        severity = "Good";
      } else if (lowerObs.includes("low") || lowerObs.includes("minor")) {
        severity = "Low";
      }

      return {
        title: `Observation ${index + 1}`,
        description: obs,
        severity,
      };
    });

    // Add SynthID result as an anomaly if present
    if (geminiResult.synth_id_result && geminiResult.synth_id_result.toLowerCase().includes("watermark")) {
      anomalies.unshift({
        title: "SynthID Watermark Detection",
        description: geminiResult.synth_id_result,
        severity: "Critical" as Severity,
      });
    }

    // Create reality trace from confidence and verdict
    const realityTrace = [
      { step: geminiResult.overall_verdict === "likely_ai" ? "AI Generation Detected" : "Source Analysis", confidence: Math.floor(geminiResult.confidence * 100) },
      { step: "Visual Forensics Completed", confidence: Math.floor(geminiResult.confidence * 90) },
      { step: "Final Assessment", confidence: Math.floor(geminiResult.confidence * 95) },
    ];

    // Map to truth score
    const risk = geminiResult.overall_verdict === "likely_ai" ? "HIGH" : 
                 geminiResult.overall_verdict === "likely_real" ? "LOW" : "MEDIUM";
    
    const truthScore = {
      risk: risk as "HIGH" | "MEDIUM" | "LOW",
      category: geminiResult.overall_verdict === "likely_ai" ? "AI-Generated Content" : 
                geminiResult.overall_verdict === "likely_real" ? "Appears Authentic" : "Insufficient Data",
      impact: geminiResult.explanation,
      recommendation: geminiResult.overall_verdict === "likely_ai" 
        ? "This content appears to be AI-generated. Verify source before trusting."
        : geminiResult.overall_verdict === "likely_real"
        ? "Content appears authentic based on analysis."
        : "Additional verification recommended.",
    };

    return {
      score,
      status,
      color,
      anomalies,
      realityTrace,
      truthScore,
      sourceMatch: {
        template: geminiResult.synth_id_result && geminiResult.synth_id_result.includes("watermark") ? false : "N/A",
        online: false,
        format: geminiResult.overall_verdict === "likely_ai" ? "Failed AI detection checks" : "Passed basic checks",
      },
    };
  }, []);

  /**
   * Analyze file using Gemini API
   */
  const analyzeWithGemini = useCallback(async (file: File): Promise<AnalysisResult> => {
    try {
      const geminiResult = await analyzeImageAPI(file);
      return convertGeminiResult(geminiResult, file.name);
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      // Fallback to basic analysis on error
      return {
        score: 50,
        status: "ANALYSIS ERROR",
        color: "yellow",
        anomalies: [
          {
            title: "Analysis Failed",
            description: error instanceof Error ? error.message : "Unable to analyze image. Please try again.",
            severity: "Medium",
          },
        ],
        realityTrace: [{ step: "Analysis Error", confidence: 0 }],
        truthScore: {
          risk: "MEDIUM",
          category: "Analysis Error",
          impact: "Could not complete full analysis",
          recommendation: "Please try uploading the image again or contact support.",
        },
        sourceMatch: {
          template: "N/A",
          online: false,
          format: "Analysis unavailable",
        },
      };
    }
  }, [convertGeminiResult]);

  const handleFileSelect = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setState("analyzing");
    analysisReadyRef.current = false;
    
    try {
      // Start analysis in parallel with animation
      const analysisResult = await analyzeWithGemini(file);
      setResult(analysisResult);
      analysisReadyRef.current = true;
    } catch (error) {
      console.error("Analysis error:", error);
      // Set error result
      setResult({
        score: 0,
        status: "ANALYSIS FAILED",
        color: "red",
        anomalies: [
          {
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to analyze image",
            severity: "Critical",
          },
        ],
        realityTrace: [{ step: "Error occurred", confidence: 0 }],
        truthScore: {
          risk: "HIGH",
          category: "Analysis Error",
          impact: "Could not analyze the image",
          recommendation: "Please try again or contact support.",
        },
        sourceMatch: {
          template: false,
          online: false,
          format: "Error",
        },
      });
      analysisReadyRef.current = true;
    }
  }, [analyzeWithGemini]);

  const handleExampleSelect = useCallback((key: string) => {
    const exampleResult = exampleResults[key];
    setUploadedImage(exampleResult.exampleImage || null);
    setState("analyzing");
    setResult(exampleResult);
  }, []);

  const handleAnalysisComplete = useCallback(() => {
    // Clear any existing interval first
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Check if analysis is ready, if not wait a bit
    if (analysisReadyRef.current) {
      setState("results");
    } else {
      // Wait for analysis to complete (poll every 200ms, max 15 seconds)
      let attempts = 0;
      const maxAttempts = 75; // 15 seconds / 200ms
      
      checkIntervalRef.current = setInterval(() => {
        attempts++;
        if (analysisReadyRef.current || attempts >= maxAttempts) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          setState("results");
        }
      }, 200);
    }
  }, []);
  const handleReset = useCallback(() => {
    // Clean up any running intervals
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    setState("idle");
    setResult(null);
    setUploadedImage(null);
    analysisReadyRef.current = false;
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <section id="demo" className="relative min-h-screen py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[hsl(250,50%,5%)] to-background" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, hsl(var(--cyan) / 0.12) 0%, transparent 60%)' }} />
      <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-purple/8 rounded-full blur-[200px]" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-cyan/6 rounded-full blur-[180px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <Zap className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">Live Demo</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">See It <span className="text-gradient-vibrant">In Action</span></h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Upload any image and watch TrustLens reveal the truth</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="glass-card rounded-[2rem] p-6 md:p-10 shadow-card border-cyan/20">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
            <div className="lg:col-span-2">
              <UploadArea onFileSelect={handleFileSelect} onExampleSelect={handleExampleSelect} isDragging={isDragging} setIsDragging={setIsDragging} disabled={state === "analyzing"} />
            </div>
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {state === "idle" && <EmptyState key="empty" />}
                {state === "analyzing" && <AnalysisAnimation key="analyzing" onComplete={handleAnalysisComplete} />}
                {state === "results" && result && <ResultsDashboard key="results" result={result} onReset={handleReset} uploadedImage={uploadedImage || undefined} />}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
