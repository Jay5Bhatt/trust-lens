import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import type { Anomaly, Severity } from "./types";

type AnomalyReportProps = {
  anomalies: Anomaly[];
};

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  Critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  High: { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  Medium: { icon: Info, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  Low: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  Good: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
};

export function AnomalyReport({ anomalies }: AnomalyReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-3xl p-6 md:p-8"
    >
      <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        Anomaly Report ({anomalies.length} issues)
      </h4>

      <div className="grid gap-4 sm:grid-cols-2">
        {anomalies.map((anomaly, index) => {
          const config = severityConfig[anomaly.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.3 }}
              className={`rounded-2xl p-5 ${config.bg} ${config.border} border transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="font-semibold text-foreground truncate">{anomaly.title}</h5>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.color} shrink-0`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{anomaly.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
