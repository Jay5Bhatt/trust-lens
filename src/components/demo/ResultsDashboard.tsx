import { motion } from "framer-motion";
import { RotateCcw, Play, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { AuthenticityScore } from "./AuthenticityScore";
import { AnomalyReport } from "./AnomalyReport";
import { RealityTrace } from "./RealityTrace";
import { TruthScoreCard } from "./TruthScoreCard";
import { SourceMatchShield } from "./SourceMatchShield";
import { VideoForensicSignals } from "./VideoForensicSignals";
import type { AnalysisResult } from "./types";

type ResultsDashboardProps = {
  result: AnalysisResult;
  onReset: () => void;
  uploadedImage?: string;
  uploadedVideo?: string;
};

export function ResultsDashboard({ result, onReset, uploadedImage, uploadedVideo }: ResultsDashboardProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideo = !!uploadedVideo || !!result.exampleVideo;
  const videoUrl = uploadedVideo || result.exampleVideo;

  const handleVideoClick = () => {
    setIsVideoPlaying(true);
    // Video will auto-play when isVideoPlaying is true
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Preview Label for Video */}
      {isVideo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-yellow-400">Preview</span> — full video verification is part of the next deployment phase
            </p>
          </div>
        </motion.div>
      )}

      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analysis Complete</h3>
          {isVideo && result.status === "AI-GENERATED VIDEO" && (
            <p className="text-sm text-red-400 font-medium mt-1">Deep Fake Video Detected</p>
          )}
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

      {/* Main Results Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Authenticity Score */}
        <AuthenticityScore
          score={result.score}
          status={result.status}
          color={result.color}
        />

        {/* Visual Analysis Panel */}
        {isVideo && videoUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 md:p-8"
          >
            <h4 className="font-bold text-lg mb-4">Video Analysis</h4>
            <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
              {!isVideoPlaying ? (
                <div className="relative w-full aspect-video bg-black/50 cursor-pointer group" onClick={handleVideoClick}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all pointer-events-none">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-cyan/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(94,247,166,0.5)] pointer-events-auto cursor-pointer"
                    >
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </motion.div>
                  </div>
                  {result.color === "red" && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-red-500/90 text-white font-bold text-xs backdrop-blur-sm pointer-events-none">
                      {result.status}
                    </div>
                  )}
                </div>
              ) : (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRef.current = el;
                      el.play().catch(() => {
                        // Auto-play failed, user will need to click play
                      });
                    }
                  }}
                  src={videoUrl}
                  className="w-full max-h-[400px] object-contain"
                  controls
                  autoPlay
                  onEnded={() => setIsVideoPlaying(false)}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Source Video Analysis
            </p>
          </motion.div>
        ) : uploadedImage ? (
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
        ) : null}
      </div>

      {/* Video Forensic Signals - only for videos */}
      {isVideo && <VideoForensicSignals anomalies={result.anomalies} />}

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
