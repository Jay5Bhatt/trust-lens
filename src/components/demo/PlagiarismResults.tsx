import { motion } from "framer-motion";
import { RotateCcw, ExternalLink, AlertTriangle, FileText, Bot, User } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import type { PlagiarismReport } from "@/lib/types/plagiarism";

type PlagiarismResultsProps = {
  result: PlagiarismReport;
  onReset: () => void;
};

export function PlagiarismResults({ result, onReset }: PlagiarismResultsProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          stroke: "#EF4444",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
        };
      case "medium":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          stroke: "#F59E0B",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
        };
      default:
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          stroke: "#10B981",
          glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
        };
    }
  };

  const getAIColor = (verdict: string, likelihood: number) => {
    if (verdict === "likely_ai" || likelihood > 0.6) {
      return {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: Bot,
        label: "AI-Generated",
      };
    } else if (verdict === "likely_human" || likelihood < 0.4) {
      return {
        text: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        icon: User,
        label: "Human-Written",
      };
    } else {
      return {
        text: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        icon: FileText,
        label: "Uncertain",
      };
    }
  };

  const riskColor = getRiskColor(result.riskLevel);
  const aiColor = getAIColor(result.aiVerdict, result.aiGeneratedLikelihood);
  const AIIcon = aiColor.icon;

  // Calculate authenticity score (inverse of plagiarism percentage)
  const authenticityScore = Math.max(0, 100 - result.plagiarismPercentage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Analysis Complete</h3>
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

      {/* Main Metrics Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plagiarism Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`glass-card rounded-3xl p-8 ${riskColor.bg} ${riskColor.border} border ${riskColor.glow}`}
        >
          <h4 className="font-semibold text-muted-foreground mb-6 text-center text-lg">
            Plagiarism Detection
          </h4>
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold mb-4" style={{ color: riskColor.stroke }}>
              {result.plagiarismPercentage.toFixed(1)}%
            </div>
            <div
              className={`px-6 py-3 rounded-xl ${riskColor.bg} ${riskColor.border} border mb-4`}
            >
              <span className={`text-xl font-bold ${riskColor.text}`}>
                {result.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Authenticity</span>
                <span className={riskColor.text}>{authenticityScore.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: riskColor.stroke }}
                  initial={{ width: 0 }}
                  animate={{ width: `${authenticityScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Detection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`glass-card rounded-3xl p-8 ${aiColor.bg} ${aiColor.border} border`}
        >
          <h4 className="font-semibold text-muted-foreground mb-6 text-center text-lg">
            AI Detection
          </h4>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center mb-4">
              <AIIcon className={`w-10 h-10 ${aiColor.text}`} />
            </div>
            <div className={`text-3xl font-bold mb-2 ${aiColor.text}`}>
              {(result.aiGeneratedLikelihood * 100).toFixed(0)}%
            </div>
            <div className={`px-4 py-2 rounded-lg ${aiColor.bg} ${aiColor.border} border`}>
              <span className={`font-semibold ${aiColor.text}`}>{aiColor.label}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Likelihood of AI generation
            </p>
          </div>
        </motion.div>
      </div>

      {/* Suspicious Segments */}
      {result.suspiciousSegments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-3xl p-6 md:p-8"
        >
          <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Suspicious Segments ({result.suspiciousSegments.length})
          </h4>
          <div className="space-y-4">
            {result.suspiciousSegments.map((segment, index) => {
              const isExpanded = expandedSegments.has(index);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                  className="rounded-2xl p-5 bg-muted/30 border border-border/50"
                >
                  <button
                    onClick={() => toggleSegment(index)}
                    className="w-full text-left flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Segment {index + 1}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                          {(segment.similarityScore * 100).toFixed(0)}% similar
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {segment.textPreview}
                      </p>
                    </div>
                    <div className="text-muted-foreground">
                      {isExpanded ? "▼" : "▶"}
                    </div>
                  </button>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border/50"
                    >
                      <p className="text-sm text-muted-foreground mb-4">
                        {segment.textPreview}
                      </p>
                      {segment.sources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Matched Sources:
                          </p>
                          {segment.sources.map((source, sourceIndex) => (
                            <a
                              key={sourceIndex}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 rounded-lg bg-muted/50 hover:bg-muted/70 border border-border/50 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {source.title && (
                                    <p className="font-semibold text-sm text-foreground mb-1 truncate">
                                      {source.title}
                                    </p>
                                  )}
                                  {source.snippet && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                      {source.snippet}
                                    </p>
                                  )}
                                  <p className="text-xs text-cyan truncate">{source.url}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan shrink-0 mt-1" />
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Similarity: {(source.similarityScore * 100).toFixed(0)}%
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <h4 className="font-bold text-lg mb-4">Analysis Summary</h4>
        <p className="text-muted-foreground leading-relaxed">{result.explanation}</p>
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Text Length:</span>
            <span className="ml-2 font-semibold">{result.normalizedTextLength.toLocaleString()} characters</span>
          </div>
          <div>
            <span className="text-muted-foreground">Suspicious Segments:</span>
            <span className="ml-2 font-semibold">{result.suspiciousSegments.length}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

