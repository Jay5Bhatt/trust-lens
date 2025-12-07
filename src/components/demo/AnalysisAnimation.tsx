import { motion } from "framer-motion";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const analysisSteps = [
  "Reading metadata...",
  "Analyzing pixel patterns...",
  "Checking structural consistency...",
  "Cross-verifying templates...",
  "Generating forensic report...",
];

type AnalysisAnimationProps = {
  onComplete: () => void;
};

export function AnalysisAnimation({ onComplete }: AnalysisAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 100);

    // Step advancement
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onComplete, 500);
          return prev;
        }
        setCompletedSteps(completed => [...completed, prev]);
        return prev + 1;
      });
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  // Mark final step as complete when progress reaches 100
  useEffect(() => {
    if (progress >= 100 && !completedSteps.includes(analysisSteps.length - 1)) {
      setCompletedSteps(prev => [...prev, analysisSteps.length - 1]);
    }
  }, [progress, completedSteps]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card rounded-3xl p-10 md:p-16 text-center h-full flex flex-col justify-center"
    >
      {/* Spinner */}
      <div className="relative w-28 h-28 mx-auto mb-10">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-cyan border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <Shield className="absolute inset-0 m-auto w-12 h-12 text-cyan" />
      </div>

      <h3 className="text-2xl md:text-3xl font-bold mb-8">Analyzing Upload...</h3>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-10">
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan to-purple"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% Complete</p>
      </div>

      {/* Analysis Steps */}
      <div className="space-y-4 max-w-sm mx-auto">
        {analysisSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index && !isCompleted;
          const isPending = index > currentStep;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isPending ? 0.3 : 1, 
                x: 0 
              }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={`flex items-center gap-4 text-left ${
                isPending ? "text-muted-foreground/40" : "text-foreground"
              }`}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                </motion.div>
              ) : isCurrent ? (
                <Loader2 className="w-6 h-6 text-cyan animate-spin shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
              <span className="text-base">{step}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
