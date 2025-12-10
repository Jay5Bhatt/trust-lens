import { motion } from "framer-motion";
import { Upload, FileText, Type, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";

const SAMPLE_PLAGIARISM_TEXT = `
Climate change is one of the most debated topics of this century. Many articles online repeat the same facts, statistics, and phrases without adding any new perspective.

In this short passage, the first paragraph imitates a very generic, overused style you can find on thousands of websites. The second paragraph, however, is more personal and reflective, which usually looks more like original writing.

When you run this example through AI/Plagiarism Check, you should see some overlap risk from the generic lines, but also a lower risk overall and a medium AI-likelihood score.
`.trim();

type TextUploadAreaProps = {
  onTextSubmit: (text: string) => void;
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  disabled: boolean;
};

export function TextUploadArea({
  onTextSubmit,
  onFileSelect,
  isDragging,
  setIsDragging,
  disabled,
}: TextUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [showTextInput, setShowTextInput] = useState(true);

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
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "text/plain",
    ];

    if (file.size > maxSize) {
      alert("File too large. Maximum size is 10MB.");
      return false;
    }
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Supported: PDF, DOCX, TXT");
      return false;
    }
    return true;
  };

  const handleTextSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText.length < 50) {
      alert("Please enter at least 50 characters of text to analyze.");
      return;
    }
    onTextSubmit(trimmedText);
  };

  const handleUseExample = () => {
    setText(SAMPLE_PLAGIARISM_TEXT);
  };

  return (
    <div className="space-y-6">
      {/* Toggle between text input and file upload */}
      <div className="flex gap-2 p-1 glass-card rounded-xl">
        <button
          onClick={() => setShowTextInput(true)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showTextInput
              ? "bg-gradient-to-r from-cyan/20 to-purple/20 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Type className="w-4 h-4 inline mr-2" />
          Paste Text
        </button>
        <button
          onClick={() => setShowTextInput(false)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showTextInput
              ? "bg-gradient-to-r from-cyan/20 to-purple/20 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
      </div>

      {showTextInput ? (
        /* Text Input Area */
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            {/* Example button and helper text */}
            <div className="mb-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUseExample}
                disabled={disabled}
                className="text-xs"
              >
                Use Example Text
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: Use the example text to quickly demo how AI/Plagiarism Check works.
              </p>
            </div>
            
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here to check for plagiarism and AI-generated content..."
              disabled={disabled}
              className="w-full min-h-[200px] bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/50"
              style={{ fontFamily: "inherit" }}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {text.length} characters
                {text.length < 50 && (
                  <span className="text-yellow-500 ml-1">
                    (minimum 50 required)
                  </span>
                )}
              </span>
              <motion.button
                onClick={handleTextSubmit}
                disabled={disabled || text.trim().length < 50}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-sm transition-all"
              >
                Analyze Text
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        /* File Upload Area */
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
            border: isDragging ? "2px solid #5EF7A6" : "2px dashed transparent",
            boxShadow: isDragging
              ? "0 0 40px rgba(94, 247, 166, 0.4), 0 0 80px rgba(139, 92, 246, 0.3), inset 0 0 60px rgba(94, 247, 166, 0.1)"
              : "0 0 20px rgba(94, 247, 166, 0.2), 0 0 40px rgba(139, 92, 246, 0.15)",
          }}
        >
          <svg
            className="upload-area-border"
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
              <linearGradient
                id="textUploadBorderGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
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
              stroke="url(#textUploadBorderGradient)"
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
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
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
            <p className="text-lg font-semibold mb-3">
              Drag & drop or click to upload
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> PDF
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> DOCX
              </span>
              <span className="flex items-center gap-1">
                <Type className="w-4 h-4" /> TXT
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}







