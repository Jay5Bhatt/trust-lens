import { motion } from "framer-motion";
import { Briefcase, Shield } from "lucide-react";

export function ResumeEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass-card rounded-3xl p-16 text-center h-full flex flex-col items-center justify-center min-h-[500px]"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center mb-8"
      >
        <Briefcase className="w-12 h-12 text-cyan" />
      </motion.div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
        <Shield className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-yellow-400">Enterprise Preview</span>
      </div>
      <h3 className="text-2xl font-bold mb-4">Resume Verification</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
        Upload a PDF resume to analyze hiring risk through forensic document analysis. Detect AI-generated content, verify employment timelines, and assess credential authenticity.
      </p>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan" />
          <span>PDF Resumes</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple" />
          <span>Forensic Analysis</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-4">
        Enterprise Preview — Full deployment planned
      </p>
    </motion.div>
  );
}


