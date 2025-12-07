import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { AuthenticityScore } from "./AuthenticityScore";
import { AnomalyReport } from "./AnomalyReport";
import { RealityTrace } from "./RealityTrace";
import { TruthScoreCard } from "./TruthScoreCard";
import { SourceMatchShield } from "./SourceMatchShield";
import type { AnalysisResult } from "./types";

type ResultsDashboardProps = {
  result: AnalysisResult;
  onReset: () => void;
  uploadedImage?: string;
};

export function ResultsDashboard({ result, onReset, uploadedImage }: ResultsDashboardProps) {
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

      {/* Main Results Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Authenticity Score */}
        <AuthenticityScore
          score={result.score}
          status={result.status}
          color={result.color}
        />

        {/* Visual Analysis Panel */}
        {uploadedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 md:p-8"
          >
            <h4 className="font-bold text-lg mb-4">Visual Analysis</h4>
            <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
              <img
                src={uploadedImage}
                alt="Uploaded content"
                className="w-full max-h-[400px] object-contain"
                style={{ maxWidth: '100%', maxHeight: '400px' }}
                onLoad={(e) => {
                  // Image loaded successfully
                  e.currentTarget.style.opacity = '1';
                }}
                onError={(e) => {
                  // Handle image load error
                  console.error('Failed to load image');
                }}
              />
              {/* Loading skeleton (hidden when image loads) */}
              <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center" style={{ display: 'none' }} id="image-skeleton">
                <div className="text-muted-foreground text-sm">Loading image...</div>
              </div>
              {/* Anomaly overlays would go here for a real implementation */}
              {result.color === "red" && (
                <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-bold text-sm backdrop-blur-sm">
                    {result.status}
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Source Content Analysis
            </p>
          </motion.div>
        )}
      </div>

      {/* Anomaly Report */}
      <AnomalyReport anomalies={result.anomalies} />

      {/* Reality Trace */}
      <RealityTrace steps={result.realityTrace} />

      {/* TruthScore+ and Source Match */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TruthScoreCard truthScore={result.truthScore} />
        <SourceMatchShield sourceMatch={result.sourceMatch} score={result.score} />
      </div>
    </motion.div>
  );
}
