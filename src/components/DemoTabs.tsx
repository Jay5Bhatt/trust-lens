import { useState } from "react";
import { motion } from "framer-motion";

export function DemoTabs() {
  const [activeTab, setActiveTab] = useState<"media" | "plagiarism">("media");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="flex flex-col items-center gap-4 mb-8 w-full"
    >
      {/* Tab switcher - Pills style */}
      <div className="inline-flex rounded-full bg-slate-900/70 border border-slate-700/70 px-1 py-1 backdrop-blur">
        <button
          onClick={() => setActiveTab("media")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
            activeTab === "media"
              ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          Media Check
        </button>
        <button
          onClick={() => setActiveTab("plagiarism")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
            activeTab === "plagiarism"
              ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          Plagiarism Check
        </button>
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
          : "Upload a file or paste text to scan for plagiarism and AI-written content."}
      </motion.p>
    </motion.div>
  );
}

