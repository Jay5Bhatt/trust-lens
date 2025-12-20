import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Shield } from "lucide-react";
import type { TruthScore } from "./types";

type TruthScoreCardProps = {
  truthScore: TruthScore;
};

const riskConfig = {
  HIGH: { 
    color: "text-red-400", 
    bg: "bg-red-500/10", 
    border: "border-red-500/30",
    icon: AlertTriangle,
    barColor: "bg-red-500"
  },
  MEDIUM: { 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/10", 
    border: "border-yellow-500/30",
    icon: ShieldAlert,
    barColor: "bg-yellow-500"
  },
  LOW: { 
    color: "text-green-400", 
    bg: "bg-green-500/10", 
    border: "border-green-500/30",
    icon: Shield,
    barColor: "bg-green-500"
  },
};

export function TruthScoreCard({ truthScore }: TruthScoreCardProps) {
  const config = riskConfig[truthScore.risk];
  const Icon = config.icon;
  const severityPercent = truthScore.risk === "HIGH" ? 90 : truthScore.risk === "MEDIUM" ? 60 : 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={`glass-card rounded-3xl p-4 sm:p-6 md:p-8 ${config.border} border-l-4`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h4 className="font-bold text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${config.color} shrink-0`} />
          <span className="break-words">TruthScore+™ Risk Assessment</span>
        </h4>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl ${config.bg} ${config.border} border shrink-0`}
        >
          <span className={`text-sm sm:text-base md:text-lg font-bold ${config.color} break-words`}>{truthScore.risk} RISK</span>
        </motion.div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Category */}
        <div>
          <span className="text-sm text-muted-foreground">Risk Category</span>
          <p className={`text-lg font-semibold ${config.color} mt-1`}>{truthScore.category}</p>
        </div>

        {/* Impact */}
        <div>
          <span className="text-sm text-muted-foreground">Potential Impact</span>
          <p className="text-foreground mt-1 leading-relaxed">{truthScore.impact}</p>
        </div>

        {/* Severity Meter */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Severity Level</span>
            <span className={config.color}>{severityPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${config.barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${severityPercent}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-2xl p-4 sm:p-5 ${config.bg} ${config.border} border`}>
          <span className="text-sm font-semibold text-muted-foreground block mb-2">Recommendation</span>
          <p className="font-semibold text-foreground break-words">{truthScore.recommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}
