import { motion } from "framer-motion";
import { RotateCcw, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Bot, Calendar, GraduationCap, Shield, FileText, ArrowDown } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
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
        };
      case "MEDIUM":
        return {
          text: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
        };
      default:
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
        };
    }
  };

  const getSeverity = (signal: string, data: any): "HIGH" | "MEDIUM" | "LOW" => {
    if (signal === "aiGeneratedContent") {
      if (data.likelihood > 60) return "HIGH";
      if (data.likelihood > 40) return "MEDIUM";
      return "LOW";
    }
    if (signal === "employmentTimeline") {
      return data.coherent ? "LOW" : "HIGH";
    }
    if (signal === "credentialVerification") {
      return data.verified ? "LOW" : "HIGH";
    }
    return "MEDIUM";
  };

  const getSeverityColor = (severity: "HIGH" | "MEDIUM" | "LOW") => {
    switch (severity) {
      case "HIGH":
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
        };
      case "MEDIUM":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
        };
      default:
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
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
      className="space-y-8"
    >
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analysis Complete</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/5 border border-yellow-500/20 mt-2 cursor-help">
                  <Shield className="w-3 h-3 text-yellow-400/70" />
                  <span className="text-xs font-medium text-yellow-400/70">Enterprise Preview</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Enterprise résumé verification uses the same forensic engine with additional checks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

      {/* Analyzed Document Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-4 md:p-5 border border-border/50 bg-muted/20"
      >
        <div className="flex items-center gap-4">
          <FileText className="w-10 h-10 text-cyan/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold text-muted-foreground mb-1">Analyzed Document</h5>
            <p className="font-mono text-sm font-medium text-foreground truncate">candidate_resume.pdf</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">PDF Résumé</span>
              <span className="text-xs text-muted-foreground/60">•</span>
              <span className="text-xs text-muted-foreground/60">Forensic analysis completed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Flow Indicator */}
      <div className="flex justify-center my-4">
        <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
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
          {/* Hiring Risk - Clean and Aligned */}
          <div className={`glass-card rounded-2xl p-5 md:p-6 ${riskColor.bg} ${riskColor.border} border flex flex-col items-center justify-center`}>
            <span className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Hiring Risk</span>
            <div className={`text-3xl md:text-4xl font-bold mb-3 ${riskColor.text} text-center`}>
              {result.summary.hiringRisk}
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Risk assessment based on detected signals
            </p>
          </div>

          {/* Confidence */}
          <div className={`glass-card rounded-2xl p-5 md:p-6 ${confidenceColor.bg} ${confidenceColor.border} border flex flex-col items-center justify-center`}>
            <span className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Confidence</span>
            <div className={`text-3xl md:text-4xl font-bold mb-3 ${confidenceColor.text} text-center`}>
              {result.summary.confidence}
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Analysis confidence level
            </p>
          </div>

          {/* Recommendation */}
          <div className="glass-card rounded-2xl p-5 md:p-6 border border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Recommendation</span>
            <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed text-center">
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
        <div className="mb-2">
          <h4 className="font-bold text-lg mb-1">Detection Signals</h4>
          <p className="text-sm text-muted-foreground">Explainable forensic indicators contributing to risk score</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* AI-Generated Content */}
          {(() => {
            const severity = getSeverity("aiGeneratedContent", result.detectionSignals.aiGeneratedContent);
            const severityColor = getSeverityColor(severity);
            return (
              <div className="glass-card rounded-2xl p-6 border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-foreground">AI-Generated Content</h5>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${severityColor.bg} ${severityColor.border} border ${severityColor.text}`}>
                    {severity}
                  </span>
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-3">
                  {result.detectionSignals.aiGeneratedContent.likelihood}%
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.detectionSignals.aiGeneratedContent.explanation}
                </p>
              </div>
            );
          })()}

          {/* Employment Timeline */}
          {(() => {
            const severity = getSeverity("employmentTimeline", result.detectionSignals.employmentTimeline);
            const severityColor = getSeverityColor(severity);
            const isCoherent = result.detectionSignals.employmentTimeline.coherent;
            return (
              <div className={`glass-card rounded-2xl p-6 border ${
                isCoherent
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-foreground">Employment Timeline</h5>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${severityColor.bg} ${severityColor.border} border ${severityColor.text}`}>
                    {severity}
                  </span>
                </div>
                <div className={`text-2xl font-bold mb-3 ${
                  isCoherent
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {isCoherent ? "Coherent" : "Issues Detected"}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.detectionSignals.employmentTimeline.explanation}
                </p>
              </div>
            );
          })()}

          {/* Credential Verification */}
          {(() => {
            const severity = getSeverity("credentialVerification", result.detectionSignals.credentialVerification);
            const severityColor = getSeverityColor(severity);
            const isVerified = result.detectionSignals.credentialVerification.verified;
            return (
              <div className={`glass-card rounded-2xl p-6 border ${
                isVerified
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-foreground">Credential Verification</h5>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${severityColor.bg} ${severityColor.border} border ${severityColor.text}`}>
                    {severity}
                  </span>
                </div>
                <div className={`text-2xl font-bold mb-3 ${
                  isVerified
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {isVerified ? "Verified" : "Issues Detected"}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.detectionSignals.credentialVerification.explanation}
                </p>
              </div>
            );
          })()}
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
                    <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
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
