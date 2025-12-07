import { motion } from "framer-motion";
import { Shield, Check, X, Minus } from "lucide-react";
import type { SourceMatch } from "./types";

type SourceMatchShieldProps = {
  sourceMatch: SourceMatch;
  score: number;
};

export function SourceMatchShield({ sourceMatch, score }: SourceMatchShieldProps) {
  const checks = [
    {
      label: "Template Analysis",
      value: sourceMatch.template,
      description: typeof sourceMatch.template === "string" 
        ? sourceMatch.template 
        : sourceMatch.template 
          ? "Matches official format" 
          : "Does not match official format"
    },
    {
      label: "Online Search",
      value: sourceMatch.online,
      description: sourceMatch.online ? "Matching images found" : "No matching images found"
    },
    {
      label: "Format Verification",
      value: sourceMatch.format.includes("Failed") ? false : sourceMatch.format === "N/A" ? "na" : true,
      description: sourceMatch.format
    },
    {
      label: "Resolution Check",
      value: score > 50,
      description: score > 50 ? "Consistent with device specs" : "Inconsistent resolution detected"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-3xl p-6 md:p-8"
    >
      <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
        <Shield className="w-6 h-6 text-cyan" />
        Source Match Shield - Verification Checks
      </h4>

      <div className="space-y-4">
        {checks.map((check, index) => {
          const isPass = check.value === true;
          const isFail = check.value === false;
          const isNA = check.value === "na";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.6 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isPass 
                  ? "bg-green-500/10 border border-green-500/30" 
                  : isFail 
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-muted/30 border border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPass ? "bg-green-500/20" : isFail ? "bg-red-500/20" : "bg-muted"
              }`}>
                {isPass ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : isFail ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <span className={`font-semibold ${isPass ? "text-green-400" : isFail ? "text-red-400" : "text-muted-foreground"}`}>
                  {check.label}
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">{check.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
