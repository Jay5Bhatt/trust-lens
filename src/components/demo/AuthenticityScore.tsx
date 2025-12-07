import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type AuthenticityScoreProps = {
  score: number;
  status: string;
  color: "red" | "yellow" | "green";
};

export function AuthenticityScore({ score, status, color }: AuthenticityScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  const colorClasses = {
    red: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      stroke: "#EF4444",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]"
    },
    yellow: {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      stroke: "#F59E0B",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]"
    },
    green: {
      text: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      stroke: "#10B981",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]"
    }
  };

  const colorClass = colorClasses[color];
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card rounded-3xl p-8 ${colorClass.bg} ${colorClass.border} border ${colorClass.glow}`}
    >
      <h4 className="font-semibold text-muted-foreground mb-6 text-center text-lg">Authenticity Score</h4>
      
      <div className="flex flex-col items-center">
        {/* Circular Progress Ring */}
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={colorClass.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-5xl font-bold ${colorClass.text}`}>
              {displayScore}%
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className={`px-6 py-3 rounded-xl ${colorClass.bg} ${colorClass.border} border`}
        >
          <span className={`text-xl font-bold ${colorClass.text}`}>{status}</span>
        </motion.div>

        {/* Confidence Bar */}
        <div className="w-full mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Confidence</span>
            <span className={colorClass.text}>{score > 80 ? "High" : score > 50 ? "Medium" : "Low"}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colorClass.stroke }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
