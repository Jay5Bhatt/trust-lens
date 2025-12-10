import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";

export function PlagiarismEmptyState() {
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
        <FileText className="w-12 h-12 text-cyan" />
      </motion.div>
      <h3 className="text-2xl font-bold mb-4">Check for Plagiarism & AI Content</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
        Paste your text or upload a document (PDF, DOCX, TXT) to detect plagiarism against web sources and identify AI-generated content.
      </p>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan" />
          <span>Web Search</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple" />
          <span>AI Detection</span>
        </div>
      </div>
    </motion.div>
  );
}






