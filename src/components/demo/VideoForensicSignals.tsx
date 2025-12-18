import { motion } from "framer-motion";
import { Film, AlertTriangle, Activity, Eye } from "lucide-react";

type VideoForensicSignalsProps = {
  anomalies: Array<{
    title: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Good";
  }>;
};

export function VideoForensicSignals({ anomalies }: VideoForensicSignalsProps) {
  // Filter video-specific anomalies
  const temporalCoherence = anomalies.find(a => a.title.includes("Temporal Coherence"));
  const frameArtifacts = anomalies.find(a => a.title.includes("Frame-Level"));
  const motionTexture = anomalies.find(a => a.title.includes("Motion-to-Texture"));

  const signals = [
    {
      title: "Temporal Coherence Breakdown",
      description: temporalCoherence?.description || "Frame-to-frame inconsistencies detected across video sequence.",
      confidence: 94,
      icon: Activity,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      barColor: "#EF4444", // red-500
    },
    {
      title: "Frame-Level Artifact Detection",
      description: frameArtifacts?.description || "Compression artifacts and unnatural pixel patterns detected.",
      confidence: 87,
      icon: Film,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      barColor: "#F97316", // orange-500
    },
    {
      title: "Motion-to-Texture Inconsistency",
      description: motionTexture?.description || "Motion patterns do not align with texture details.",
      confidence: 91,
      icon: Eye,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      barColor: "#EAB308", // yellow-500
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card rounded-3xl p-6 md:p-8"
    >
      <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        Video Forensic Signals
      </h4>

      <div className="grid gap-4 md:grid-cols-1">
        {signals.map((signal, index) => {
          const Icon = signal.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.5 }}
              className={`rounded-2xl p-5 ${signal.bg} ${signal.border} border transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${signal.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${signal.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="font-semibold text-foreground">{signal.title}</h5>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${signal.bg} ${signal.color}`}>
                        {signal.confidence}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{signal.description}</p>
                  {/* Confidence bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: signal.barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.confidence}%` }}
                      transition={{ duration: 0.8, delay: 0.2 * index + 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
