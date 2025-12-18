import { motion } from "framer-motion";
import { RotateCcw, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Bot, Calendar, GraduationCap, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import type { ResumeVerificationResult } from "./resume-types";

type ResumeResultsProps = {
  result: ResumeVerificationResult;
  onReset: () => void;
};

export function ResumeResults({ result, onReset }: ResumeResultsProps) {
  const [expandedExplainability, setExpandedExplainability] = useState<Set<number>>(new Set([0])); // First item expanded by default

  const toggleExplainability = (index: number) => {
    const newExpanded = new Set(expandedExplainability);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExplainability(newExpanded);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
        };
      case "MEDIUM":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
        };
      default:
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
        };
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "HIGH":
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
        };
      case "MEDIUM":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
        };
      default:
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
        };
    }
  };

  const riskColor = getRiskColor(result.summary.hiringRisk);
  const confidenceColor = getConfidenceColor(result.summary.confidence);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analysis Complete</h3>
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mt-2">
            <Shield className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Enterprise Preview</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Analyze Another
        </Button>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <h4 className="font-bold text-lg mb-6">Summary</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Hiring Risk */}
          <div className={`glass-card rounded-2xl p-6 ${riskColor.bg} ${riskColor.border} border ${riskColor.glow}`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className={`w-6 h-6 ${riskColor.text}`} />
              <h5 className="font-semibold text-muted-foreground">Hiring Risk</h5>
            </div>
            <div className={`text-4xl font-bold mb-2 ${riskColor.text}`}>
              {result.summary.hiringRisk}
            </div>
            <p className="text-sm text-muted-foreground">
              Risk assessment based on detected signals
            </p>
          </div>

          {/* Confidence */}
          <div className={`glass-card rounded-2xl p-6 ${confidenceColor.bg} ${confidenceColor.border} border`}>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className={`w-6 h-6 ${confidenceColor.text}`} />
              <h5 className="font-semibold text-muted-foreground">Confidence</h5>
            </div>
            <div className={`text-4xl font-bold mb-2 ${confidenceColor.text}`}>
              {result.summary.confidence}
            </div>
            <p className="text-sm text-muted-foreground">
              Analysis confidence level
            </p>
          </div>

          {/* Recommendation */}
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-cyan" />
              <h5 className="font-semibold text-muted-foreground">Recommendation</h5>
            </div>
            <p className="text-base font-medium text-foreground leading-relaxed">
              {result.summary.recommendation}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Detection Signals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <h4 className="font-bold text-lg mb-6">Detection Signals</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI-Generated Content */}
          <div className="glass-card rounded-2xl p-6 border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-yellow-400" />
              <h5 className="font-semibold text-foreground">AI-Generated Content</h5>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {result.detectionSignals.aiGeneratedContent.likelihood}%
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.detectionSignals.aiGeneratedContent.explanation}
            </p>
          </div>

          {/* Employment Timeline */}
          <div className={`glass-card rounded-2xl p-6 border ${
            result.detectionSignals.employmentTimeline.coherent
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className={`w-6 h-6 ${
                result.detectionSignals.employmentTimeline.coherent
                  ? "text-green-400"
                  : "text-red-400"
              }`} />
              <h5 className="font-semibold text-foreground">Employment Timeline</h5>
            </div>
            <div className={`text-2xl font-bold mb-2 ${
              result.detectionSignals.employmentTimeline.coherent
                ? "text-green-400"
                : "text-red-400"
            }`}>
              {result.detectionSignals.employmentTimeline.coherent ? "Coherent" : "Issues Detected"}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.detectionSignals.employmentTimeline.explanation}
            </p>
          </div>

          {/* Credential Verification */}
          <div className={`glass-card rounded-2xl p-6 border ${
            result.detectionSignals.credentialVerification.verified
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className={`w-6 h-6 ${
                result.detectionSignals.credentialVerification.verified
                  ? "text-green-400"
                  : "text-red-400"
              }`} />
              <h5 className="font-semibold text-foreground">Credential Verification</h5>
            </div>
            <div className={`text-2xl font-bold mb-2 ${
              result.detectionSignals.credentialVerification.verified
                ? "text-green-400"
                : "text-red-400"
            }`}>
              {result.detectionSignals.credentialVerification.verified ? "Verified" : "Issues Detected"}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.detectionSignals.credentialVerification.explanation}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Explainability Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-cyan" />
          <h4 className="font-bold text-lg">Explainability</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Detailed explanations of each detection signal, what was found, why it matters, and how it impacts hiring risk.
        </p>
        <div className="space-y-4">
          {result.explainability.map((item, index) => {
            const isExpanded = expandedExplainability.has(index);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass-card rounded-2xl border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleExplainability(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-foreground">{index + 1}</span>
                    </div>
                    <h5 className="font-semibold text-foreground">{item.signal}</h5>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6 pt-2 border-t border-border/50"
                  >
                    <div className="space-y-4 mt-4">
                      <div>
                        <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <span className="text-cyan">What was detected:</span>
                        </h6>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {item.what}
                        </p>
                      </div>
                      <div>
                        <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <span className="text-purple">Why it matters:</span>
                        </h6>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {item.why}
                        </p>
                      </div>
                      <div>
                        <h6 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <span className="text-yellow-400">Risk impact:</span>
                        </h6>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {item.riskImpact}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
