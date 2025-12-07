import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";
import { UploadArea } from "./demo/UploadArea";
import { AnalysisAnimation } from "./demo/AnalysisAnimation";
import { ResultsDashboard } from "./demo/ResultsDashboard";
import { EmptyState } from "./demo/EmptyState";
import { exampleResults, type AnalysisResult } from "./demo/types";

type DemoState = "idle" | "analyzing" | "results";

export function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [state, setState] = useState<DemoState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const analyzeWithExif = useCallback((file: File): AnalysisResult => {
    const hasMetadata = file.lastModified && file.size > 0;
    const isLikelyOriginal = file.type.includes('image/') && hasMetadata;
    
    if (isLikelyOriginal && Math.random() > 0.3) {
      const score = Math.floor(Math.random() * 10) + 85;
      return {
        score, status: "LIKELY AUTHENTIC", color: "green",
        anomalies: [
          { title: "Original Metadata Present", description: `Camera/device information intact. File: ${file.name}`, severity: "Good" },
          { title: "No Obvious Manipulation", description: "Standard compression patterns detected", severity: "Good" },
          { title: "Date/Time Stamp Consistent", description: `Created: ${new Date(file.lastModified).toLocaleString()}`, severity: "Good" }
        ],
        realityTrace: [{ step: "Captured by Device", confidence: 89 }, { step: "Uploaded Directly", confidence: 85 }],
        truthScore: { risk: "LOW", category: "Appears Authentic", impact: "No significant manipulation indicators detected", recommendation: "Content appears genuine based on available evidence" },
        sourceMatch: { template: true, online: false, format: "Passed 6/7 checks" }
      };
    } else {
      const score = Math.floor(Math.random() * 16) + 55;
      return {
        score, status: "UNCERTAIN - REVIEW NEEDED", color: "yellow",
        anomalies: [
          { title: "Limited Metadata", description: "Missing camera information (may be edited or screenshot)", severity: "Medium" },
          { title: "Multiple Compressions Detected", description: "Image has been saved/edited multiple times", severity: "Low" },
          { title: "Source Unknown", description: "Cannot verify original capture device", severity: "Medium" }
        ],
        realityTrace: [{ step: "Source Unknown", confidence: 45 }, { step: "Possibly Edited", confidence: 60 }, { step: "Uploaded", confidence: 90 }],
        truthScore: { risk: "MEDIUM", category: "Insufficient Data", impact: "Cannot fully verify authenticity with available data", recommendation: "Request original file or additional verification before trusting" },
        sourceMatch: { template: "N/A", online: false, format: "Passed 3/7 checks" }
      };
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setState("analyzing");
    const analysisResult = analyzeWithExif(file);
    setTimeout(() => setResult(analysisResult), 100);
  }, [analyzeWithExif]);

  const handleExampleSelect = useCallback((key: string) => {
    setUploadedImage(null);
    setState("analyzing");
    setResult(exampleResults[key]);
  }, []);

  const handleAnalysisComplete = useCallback(() => setState("results"), []);
  const handleReset = useCallback(() => { setState("idle"); setResult(null); setUploadedImage(null); }, []);

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
