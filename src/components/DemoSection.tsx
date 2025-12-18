import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Image, FileText, Briefcase } from "lucide-react";
import { UploadArea } from "./demo/UploadArea";
import { TextUploadArea, SAMPLE_PLAGIARISM_TEXT } from "./demo/TextUploadArea";
import { AnalysisAnimation } from "./demo/AnalysisAnimation";
import { ResultsDashboard } from "./demo/ResultsDashboard";
import { PlagiarismResults } from "./demo/PlagiarismResults";
import { EmptyState } from "./demo/EmptyState";
import { PlagiarismEmptyState } from "./demo/PlagiarismEmptyState";
import { ResumeUploadArea } from "./demo/ResumeUploadArea";
import { ResumeResults } from "./demo/ResumeResults";
import { ResumeEmptyState } from "./demo/ResumeEmptyState";
import { getExampleResumeResult } from "./demo/resume-examples";
import { DemoTabs } from "./DemoTabs";
import { exampleResults, type AnalysisResult, type Anomaly, type Severity } from "./demo/types";
import { analyzeImageCombined } from "@/lib/combined-analysis";
import { checkPlagiarismAPI } from "@/lib/plagiarismChecker-browser";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import type { PlagiarismReport } from "@/lib/types/plagiarism";
import type { ResumeVerificationResult } from "./demo/resume-types";

type DemoState = "idle" | "analyzing" | "results" | "error";
type TabValue = "image" | "text" | "resume";

/**
 * Generate mock plagiarism report for example text demo
 */
function getMockPlagiarismReport(text: string): PlagiarismReport {
  return {
    normalizedTextLength: text.length,
    plagiarismPercentage: 38.5,
    riskLevel: "medium",
    suspiciousSegments: [
      {
        startIndex: 0,
        endIndex: 150,
        textPreview: "Climate change is one of the most debated topics of this century. Many articles...",
        similarityScore: 0.72,
        sources: [
          {
            url: "https://www.example.com/climate-change-overview",
            title: "Climate Change Overview - Environmental Science",
            snippet: "Climate change is one of the most debated topics of this century. Many articles online repeat the same facts, statistics, and phrases...",
            similarityScore: 0.72,
          },
          {
            url: "https://www.example.org/climate-articles",
            title: "Common Climate Change Phrases and Statistics",
            snippet: "Many articles online repeat the same facts, statistics, and phrases without adding any new perspective.",
            similarityScore: 0.68,
          },
        ],
      },
      {
        startIndex: 151,
        endIndex: 300,
        textPreview: "In this short passage, the first paragraph imitates a very generic, overused style...",
        similarityScore: 0.65,
        sources: [
          {
            url: "https://www.example.net/writing-styles",
            title: "Generic Writing Styles in Online Content",
            snippet: "The first paragraph imitates a very generic, overused style you can find on thousands of websites.",
            similarityScore: 0.65,
          },
        ],
      },
    ],
    aiGeneratedLikelihood: 0.62,
    aiVerdict: "likely_ai",
    explanation: "Found 2 suspicious segments with 38.5% of the text potentially plagiarized. AI-generated text detection indicates this text is likely AI-generated (62% confidence). Overall risk level: MEDIUM.",
    analysisStatus: "success",
  };
}

export function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<TabValue>("image");
  
  // Image analysis state
  const [imageState, setImageState] = useState<DemoState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [imageResult, setImageResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const imageAnalysisReadyRef = useRef(false);
  const imageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text analysis state
  const [textState, setTextState] = useState<DemoState>("idle");
  const [isTextDragging, setIsTextDragging] = useState(false);
  const [textResult, setTextResult] = useState<PlagiarismReport | null>(null);
  const [textError, setTextError] = useState<{ message: string; errorType?: string } | null>(null);
  const textAnalysisReadyRef = useRef(false);
  const textCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Analyze file using 2-step process: EXIF metadata + Gemini AI
   */
  const analyzeWithCombined = useCallback(async (file: File): Promise<AnalysisResult> => {
    try {
      // This performs both EXIF and Gemini analysis
      const result = await analyzeImageCombined(file);
      return result;
    } catch (error) {
      console.error("Combined analysis failed:", error);
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
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setImageState("analyzing");
    imageAnalysisReadyRef.current = false;
    
    try {
      // Start 2-step analysis (EXIF + Gemini) in parallel with animation
      const analysisResult = await analyzeWithCombined(file);
      setImageResult(analysisResult);
      imageAnalysisReadyRef.current = true;
    } catch (error) {
      console.error("Analysis error:", error);
      // Set error result
      setImageResult({
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
      imageAnalysisReadyRef.current = true;
    }
  }, [analyzeWithCombined]);

  const handleExampleSelect = useCallback((key: string) => {
    // Examples use mock data - no API calls needed
    const exampleResult = exampleResults[key];
    setUploadedImage(exampleResult.exampleImage || null);
    setUploadedVideo(exampleResult.exampleVideo || null);
    setImageState("analyzing");
    setImageResult(exampleResult);
    // Mark as ready immediately since examples don't need real analysis
    imageAnalysisReadyRef.current = true;
  }, []);

  /**
   * Handle text submission for plagiarism checking
   */
  const handleTextSubmit = useCallback(async (text: string) => {
    setTextState("analyzing");
    setTextError(null);
    setTextResult(null);
    textAnalysisReadyRef.current = false;

    try {
      // Check if this is the example text - if so, return mock result with fake processing
      const normalizedText = text.trim();
      const normalizedExample = SAMPLE_PLAGIARISM_TEXT.trim();
      
      if (normalizedText === normalizedExample) {
        // This is example text - show fake processing (3-5 seconds) then return mock result
        const processingDelay = 3000 + Math.random() * 2000; // 3-5 seconds
        await new Promise((resolve) => setTimeout(resolve, processingDelay));
        
        const mockResult = getMockPlagiarismReport(text);
        setTextResult(mockResult);
        setTextState("results");
        textAnalysisReadyRef.current = true;
        return;
      }

      // Real API call for non-example text
      const result = await checkPlagiarismAPI({ text });
      setTextResult(result);
      setTextState("results");
      textAnalysisReadyRef.current = true;
    } catch (error) {
      console.error("Plagiarism check error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorType = (error as any)?.errorType;
      setTextError({ message: errorMessage, errorType });
      setTextState("error");
      textAnalysisReadyRef.current = true;
    }
  }, []);

  /**
   * Handle file upload for plagiarism checking
   */
  const handleTextFileSelect = useCallback(async (file: File) => {
    setTextState("analyzing");
    setTextError(null);
    setTextResult(null);
    textAnalysisReadyRef.current = false;

    console.log("[DemoSection] Starting file upload", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      const result = await checkPlagiarismAPI({
        fileBuffer: file,
        fileName: file.name,
      });
      
      console.log("[DemoSection] Received result", {
        hasResult: !!result,
        plagiarismPercentage: result?.plagiarismPercentage,
        riskLevel: result?.riskLevel,
      });

      if (!result) {
        throw new Error("Server returned empty result");
      }

      setTextResult(result);
      setTextState("results");
      textAnalysisReadyRef.current = true;
    } catch (error) {
      console.error("[DemoSection] Plagiarism check error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const errorType = (error as any)?.errorType || "analysis_error";
      
      console.log("[DemoSection] Setting error state", {
        errorMessage,
        errorType,
      });

      setTextError({ message: errorMessage, errorType });
      setTextState("error");
      textAnalysisReadyRef.current = true;
    }
  }, []);

  const handleImageAnalysisComplete = useCallback(() => {
    // Clear any existing interval first
    if (imageCheckIntervalRef.current) {
      clearInterval(imageCheckIntervalRef.current);
      imageCheckIntervalRef.current = null;
    }

    // Check if analysis is ready, if not wait a bit
    if (imageAnalysisReadyRef.current) {
      setImageState("results");
    } else {
      // Wait for analysis to complete (poll every 200ms, max 15 seconds)
      let attempts = 0;
      const maxAttempts = 75; // 15 seconds / 200ms
      
      imageCheckIntervalRef.current = setInterval(() => {
        attempts++;
        if (imageAnalysisReadyRef.current || attempts >= maxAttempts) {
          if (imageCheckIntervalRef.current) {
            clearInterval(imageCheckIntervalRef.current);
            imageCheckIntervalRef.current = null;
          }
          setImageState("results");
        }
      }, 200);
    }
  }, []);

  const handleTextAnalysisComplete = useCallback(() => {
    // Clear any existing interval first
    if (textCheckIntervalRef.current) {
      clearInterval(textCheckIntervalRef.current);
      textCheckIntervalRef.current = null;
    }

    // Check if analysis is ready, if not wait a bit
    if (textAnalysisReadyRef.current) {
      // Don't change state here - it's already set in handleTextSubmit/handleTextFileSelect
      // State is either "results" or "error" depending on success/failure
    } else {
      // Wait for analysis to complete (poll every 200ms, max 15 seconds)
      let attempts = 0;
      const maxAttempts = 75; // 15 seconds / 200ms
      
      textCheckIntervalRef.current = setInterval(() => {
        attempts++;
        if (textAnalysisReadyRef.current || attempts >= maxAttempts) {
          if (textCheckIntervalRef.current) {
            clearInterval(textCheckIntervalRef.current);
            textCheckIntervalRef.current = null;
          }
          setTextState("results");
        }
      }, 200);
    }
  }, []);

  // Handle oversized/unsupported file errors from TextUploadArea
  const handleFileSizeError = useCallback((message: string) => {
    setTextError({ message, errorType: "file_too_large" });
    setTextState("error");
    textAnalysisReadyRef.current = true;
  }, []);

  const handleImageReset = useCallback(() => {
    // Clean up any running intervals
    if (imageCheckIntervalRef.current) {
      clearInterval(imageCheckIntervalRef.current);
      imageCheckIntervalRef.current = null;
    }
    setImageState("idle");
    setImageResult(null);
    setUploadedImage(null);
    imageAnalysisReadyRef.current = false;
  }, []);

  const handleTextReset = useCallback(() => {
    // Clean up any running intervals
    if (textCheckIntervalRef.current) {
      clearInterval(textCheckIntervalRef.current);
      textCheckIntervalRef.current = null;
    }
    setTextState("idle");
    setTextResult(null);
    setTextError(null);
    textAnalysisReadyRef.current = false;
  }, []);

  /**
   * Handle resume example selection
   */
  const handleResumeExampleSelect = useCallback(() => {
    setResumeState("analyzing");
    resumeAnalysisReadyRef.current = false;
    
    // Simulate analysis delay (2-4 seconds) for demo purposes
    setTimeout(() => {
      const exampleResult = getExampleResumeResult();
      setResumeResult(exampleResult);
      resumeAnalysisReadyRef.current = true;
    }, 2000 + Math.random() * 2000);
  }, []);

  /**
   * Handle resume file upload (optional - demo doesn't depend on this)
   */
  const handleResumeFileSelect = useCallback(async (file: File) => {
    setResumeState("analyzing");
    resumeAnalysisReadyRef.current = false;
    
    // For demo purposes, use the same example result
    // In production, this would call a real API
    setTimeout(() => {
      const exampleResult = getExampleResumeResult();
      setResumeResult(exampleResult);
      resumeAnalysisReadyRef.current = true;
    }, 2000 + Math.random() * 2000);
  }, []);

  const handleResumeAnalysisComplete = useCallback(() => {
    // Clear any existing interval first
    if (resumeCheckIntervalRef.current) {
      clearInterval(resumeCheckIntervalRef.current);
      resumeCheckIntervalRef.current = null;
    }

    // Check if analysis is ready, if not wait a bit
    if (resumeAnalysisReadyRef.current) {
      setResumeState("results");
    } else {
      // Wait for analysis to complete (poll every 200ms, max 15 seconds)
      let attempts = 0;
      const maxAttempts = 75; // 15 seconds / 200ms
      
      resumeCheckIntervalRef.current = setInterval(() => {
        attempts++;
        if (resumeAnalysisReadyRef.current || attempts >= maxAttempts) {
          if (resumeCheckIntervalRef.current) {
            clearInterval(resumeCheckIntervalRef.current);
            resumeCheckIntervalRef.current = null;
          }
          setResumeState("results");
        }
      }, 200);
    }
  }, []);

  const handleResumeReset = useCallback(() => {
    // Clean up any running intervals
    if (resumeCheckIntervalRef.current) {
      clearInterval(resumeCheckIntervalRef.current);
      resumeCheckIntervalRef.current = null;
    }
    setResumeState("idle");
    setResumeResult(null);
    resumeAnalysisReadyRef.current = false;
  }, []);

  // Callback to try demo example - switches to text input and fills with example text
  const handleTryDemoExample = useCallback(() => {
    // Switch to text tab if not already
    setActiveTab("text");
    // Reset state
    setTextState("idle");
    setTextResult(null);
    setTextError(null);
    textAnalysisReadyRef.current = false;
    // Trigger example text submission after a brief delay to ensure UI is ready
    setTimeout(() => {
      handleTextSubmit(SAMPLE_PLAGIARISM_TEXT);
    }, 100);
  }, [handleTextSubmit]);

  // Callback to switch to paste text mode
  const handlePasteTextInstead = useCallback(() => {
    // Switch to text tab if not already
    setActiveTab("text");
    // Reset state to show text input
    handleTextReset();
    // Text input will be shown by default in TextUploadArea
  }, [handleTextReset]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (imageCheckIntervalRef.current) {
        clearInterval(imageCheckIntervalRef.current);
        imageCheckIntervalRef.current = null;
      }
      if (textCheckIntervalRef.current) {
        clearInterval(textCheckIntervalRef.current);
        textCheckIntervalRef.current = null;
      }
      if (resumeCheckIntervalRef.current) {
        clearInterval(resumeCheckIntervalRef.current);
        resumeCheckIntervalRef.current = null;
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
          <DemoTabs />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="glass-card rounded-[2rem] p-6 md:p-10 shadow-card border-cyan/20">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
            <div className="mb-8 flex w-full max-w-2xl mx-auto h-12 bg-muted/90 backdrop-blur-xl border-2 border-cyan/50 rounded-xl p-1.5 shadow-lg relative z-10">
              <button
                onClick={() => setActiveTab("image")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "image"
                    ? "bg-gradient-to-r from-cyan/50 to-purple/50 text-white shadow-lg border border-cyan/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Media Analysis</span>
                <span className="sm:hidden">Media</span>
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "text"
                    ? "bg-gradient-to-r from-cyan/50 to-purple/50 text-white shadow-lg border border-cyan/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">AI/Plagiarism</span>
                <span className="sm:hidden">Plagiarism</span>
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs md:text-sm font-semibold transition-all relative ${
                  activeTab === "resume"
                    ? "bg-gradient-to-r from-cyan/50 to-purple/50 text-white shadow-lg border border-cyan/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Resume Verification</span>
                <span className="sm:hidden">Resume</span>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                  Enterprise
                </span>
              </button>
            </div>

            <TabsContent 
              value="image" 
              className="mt-0" 
              forceMount={activeTab === "image"}
              style={activeTab === "image" ? { display: "block" } : undefined}
            >
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
                <div className="lg:col-span-2">
                  <UploadArea 
                    onFileSelect={handleFileSelect} 
                    onExampleSelect={handleExampleSelect} 
                    isDragging={isDragging} 
                    setIsDragging={setIsDragging} 
                    disabled={imageState === "analyzing"} 
                  />
                </div>
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {imageState === "idle" && <EmptyState key="empty" />}
                    {imageState === "analyzing" && <AnalysisAnimation key="analyzing" onComplete={handleImageAnalysisComplete} />}
                    {imageState === "results" && imageResult && <ResultsDashboard key="results" result={imageResult} onReset={handleImageReset} uploadedImage={uploadedImage || undefined} uploadedVideo={uploadedVideo || undefined} />}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            <TabsContent 
              value="text" 
              className="mt-0" 
              forceMount={activeTab === "text"}
              style={activeTab === "text" ? { display: "block" } : undefined}
            >
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
                <div className="lg:col-span-2">
                  <TextUploadArea 
                    onTextSubmit={handleTextSubmit}
                    onFileSelect={handleTextFileSelect}
                    isDragging={isTextDragging}
                    setIsDragging={setIsTextDragging}
                    disabled={textState === "analyzing"}
                    onFileSizeError={handleFileSizeError}
                  />
                </div>
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {textState === "idle" && <PlagiarismEmptyState key="empty" />}
                    {textState === "analyzing" && <AnalysisAnimation key="analyzing" onComplete={handleTextAnalysisComplete} />}
                    {textState === "results" && textResult && <PlagiarismResults key="results" result={textResult} error={null} onReset={handleTextReset} onTryDemoExample={handleTryDemoExample} onPasteTextInstead={handlePasteTextInstead} />}
                    {textState === "error" && <PlagiarismResults key="error" result={null} error={textError} onReset={handleTextReset} onTryDemoExample={handleTryDemoExample} onPasteTextInstead={handlePasteTextInstead} />}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            <TabsContent 
              value="resume" 
              className="mt-0" 
              forceMount={activeTab === "resume"}
              style={activeTab === "resume" ? { display: "block" } : undefined}
            >
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
                <div className="lg:col-span-2">
                  <ResumeUploadArea 
                    onFileSelect={handleResumeFileSelect}
                    onExampleSelect={handleResumeExampleSelect}
                    isDragging={isResumeDragging}
                    setIsDragging={setIsResumeDragging}
                    disabled={resumeState === "analyzing"}
                  />
                </div>
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait">
                    {resumeState === "idle" && <ResumeEmptyState key="empty" />}
                    {resumeState === "analyzing" && <AnalysisAnimation key="analyzing" onComplete={handleResumeAnalysisComplete} />}
                    {resumeState === "results" && resumeResult && <ResumeResults key="results" result={resumeResult} onReset={handleResumeReset} />}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
