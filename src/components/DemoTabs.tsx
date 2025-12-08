import { useState } from "react";
import { motion } from "framer-motion";

export function DemoTabs() {
  const [activeTab, setActiveTab] = useState<"media" | "plagiarism">("media");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="flex flex-col items-center gap-4 mb-8"
    >
      {/* Tab switcher - Pills style */}
      <div className="glass-card rounded-full p-1.5 border border-border/50 backdrop-blur-xl bg-muted/50">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("media")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === "media"
                ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg"
                : "text-slate-300 hover:text-foreground hover:bg-muted/60"
            }`}
          >
            Media Check
          </button>
          <button
            onClick={() => setActiveTab("plagiarism")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === "plagiarism"
                ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg"
                : "text-slate-300 hover:text-foreground hover:bg-muted/60"
            }`}
          >
            Plagiarism Check
          </button>
        </div>
      </div>

      {/* Dynamic helper text */}
      <motion.p
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm md:text-base text-muted-foreground max-w-2xl text-center px-4"
      >
        {activeTab === "media"
          ? "Upload any image, video, or document to check for AI-generation, manipulation, or authenticity."
          : "Upload a file or paste text to scan for plagiarism and AI-generated writing."}
      </motion.p>
    </motion.div>
  );
}

