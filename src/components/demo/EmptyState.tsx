import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function EmptyState() {
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
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center mb-8"
      >
        <Shield className="w-12 h-12 text-cyan" />
      </motion.div>
      <h3 className="text-2xl font-bold mb-4">Upload any image to analyze</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed">
        Drag a file or select an example to see TrustLens in action. 
        Our AI-powered forensics engine will detect manipulation, verify authenticity, and assess risk.
      </p>
    </motion.div>
  );
}
