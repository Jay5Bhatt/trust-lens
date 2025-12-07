import { motion } from "framer-motion";
import { Upload, FileText, Image, Film, ArrowRight, Receipt, MessageSquare, Sparkles } from "lucide-react";
import { useRef } from "react";

type UploadAreaProps = {
  onFileSelect: (file: File) => void;
  onExampleSelect: (key: string) => void;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  disabled: boolean;
};

const examples = [
  { 
    key: "fake-upi", 
    label: "Fake UPI Slip", 
    icon: Receipt,
    emoji: "🧾",
    gradient: "from-red-500/20 to-orange-500/20"
  },
  { 
    key: "fake-whatsapp", 
    label: "Fake WhatsApp Screenshot", 
    icon: MessageSquare,
    emoji: "💬",
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  { 
    key: "ai-generated", 
    label: "AI-Generated Image", 
    icon: Sparkles,
    emoji: "🎨",
    gradient: "from-purple/20 to-pink-500/20"
  },
];

export function UploadArea({ onFileSelect, onExampleSelect, isDragging, setIsDragging, disabled }: UploadAreaProps) {
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
      e.target.value = '';
    }
  };

  const processFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
    
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.');
      return false;
    }
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Supported: JPG, PNG, PDF, MP4');
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
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
        className={`relative rounded-[16px] p-[48px] text-center transition-all duration-300 upload-area-container ${
          isDragging
            ? "scale-[1.02] upload-area-dragging"
            : "hover:scale-[1.01]"
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        style={{
          background: isDragging 
            ? 'linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(26, 30, 63, 0.95))'
            : 'linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(26, 30, 63, 0.8))',
          backdropFilter: 'blur(10px)',
          border: isDragging 
            ? '2px solid #5EF7A6'
            : '2px dashed transparent',
          boxShadow: isDragging
            ? '0 0 40px rgba(94, 247, 166, 0.4), 0 0 80px rgba(139, 92, 246, 0.3), inset 0 0 60px rgba(94, 247, 166, 0.1)'
            : '0 0 20px rgba(94, 247, 166, 0.2), 0 0 40px rgba(139, 92, 246, 0.15)',
        }}
      >
        {/* Static elegant dashed gradient border */}
        <svg
          className="upload-area-border"
          style={{
            position: 'absolute',
            inset: '-2px',
            width: 'calc(100% + 4px)',
            height: 'calc(100% + 4px)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="uploadBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke="url(#uploadBorderGradient)"
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
          accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 10,
            display: 'block',
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
          <span className="flex items-center gap-1"><Image className="w-4 h-4" /> JPG, PNG</span>
          <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> PDF</span>
          <span className="flex items-center gap-1"><Film className="w-4 h-4" /> MP4</span>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-3">Max 10MB</p>
        </div>
      </div>

      {/* Example Buttons */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">Or try an example:</p>
        <div className="grid gap-3">
          {examples.map((example) => (
            <motion.button
              key={example.key}
              onClick={() => onExampleSelect(example.key)}
              disabled={disabled}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card rounded-xl p-4 flex items-center gap-4 text-left transition-all duration-300 
                hover:bg-gradient-to-r ${example.gradient} hover:border-cyan/40 hover:shadow-glow-sm
                disabled:opacity-50 disabled:pointer-events-none group w-full`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center text-2xl shrink-0">
                {example.emoji}
              </div>
              <span className="flex-1 font-semibold">Try: {example.label}</span>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
