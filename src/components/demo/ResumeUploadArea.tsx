import { motion } from "framer-motion";
import { Upload, FileText, ArrowRight, Briefcase } from "lucide-react";
import { useRef } from "react";
import { Button } from "../ui/button";

type ResumeUploadAreaProps = {
  onFileSelect: (file: File) => void;
  onExampleSelect: () => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  disabled: boolean;
};

export function ResumeUploadArea({
  onFileSelect,
  onExampleSelect,
  isDragging,
  setIsDragging,
  disabled,
}: ResumeUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = "";
    }
  };

  const processFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validType = "application/pdf";

    if (file.size > maxSize) {
      alert("File too large. Maximum size is 10MB.");
      return false;
    }
    if (file.type !== validType) {
      alert("Invalid file type. Only PDF resumes are supported.");
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Primary Action: Try Example Resume */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          onClick={onExampleSelect}
          disabled={disabled}
          variant="glow"
          size="lg"
          className="w-full h-auto py-6 text-lg font-semibold group"
        >
          <Briefcase className="w-5 h-5 mr-2" />
          Try Example Resume
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or upload your own</span>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative rounded-[16px] p-[48px] text-center transition-all duration-300 ${
          isDragging
            ? "scale-[1.02]"
            : "hover:scale-[1.01]"
        } ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        style={{
          background: isDragging
            ? "linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(26, 30, 63, 0.95))"
            : "linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(26, 30, 63, 0.8))",
          backdropFilter: "blur(10px)",
          border: isDragging
            ? "2px solid #5EF7A6"
            : "2px dashed transparent",
          boxShadow: isDragging
            ? "0 0 40px rgba(94, 247, 166, 0.4), 0 0 80px rgba(139, 92, 246, 0.3), inset 0 0 60px rgba(94, 247, 166, 0.1)"
            : "0 0 20px rgba(94, 247, 166, 0.2), 0 0 40px rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Static elegant dashed gradient border */}
        <svg
          style={{
            position: "absolute",
            inset: "-2px",
            width: "calc(100% + 4px)",
            height: "calc(100% + 4px)",
            borderRadius: "16px",
            pointerEvents: "none",
            zIndex: 0,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="resumeUploadBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5EF7A6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#5EF7A6" />
            </linearGradient>
          </defs>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="8"
            ry="8"
            fill="none"
            stroke="url(#resumeUploadBorderGradient)"
            strokeWidth="1"
            strokeDasharray="8 4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={isDragging ? 0 : 1}
          />
        </svg>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 10,
            display: "block",
          }}
          disabled={disabled}
        />
        <div className="relative z-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Upload className="w-16 h-16 mx-auto mb-6 text-cyan drop-shadow-[0_0_20px_rgba(94,247,166,0.5)]" />
          </motion.div>
          <p className="text-lg font-semibold mb-3">Drag & drop or click to upload</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> PDF
            </span>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-3">Max 10MB</p>
        </div>
      </div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-4 border border-cyan/20 bg-cyan/5"
      >
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-semibold text-foreground">PDF resumes</span> ·{" "}
          <span className="text-yellow-400">Enterprise preview</span> ·{" "}
          <span className="text-foreground">Forensic document analysis</span>
        </p>
      </motion.div>
    </div>
  );
}
