import { motion } from "framer-motion";
import { Upload, FileText, Image, Film, ArrowRight, Receipt, MessageSquare, Sparkles } from "lucide-react";

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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl p-10 text-center transition-all duration-300 ${
          isDragging
            ? "bg-cyan/10 border-2 border-cyan"
            : "border-2 border-dashed border-border hover:border-cyan/50 hover:bg-cyan/5"
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{
          backgroundImage: isDragging ? undefined : `
            linear-gradient(90deg, hsl(var(--cyan) / 0.3) 50%, transparent 50%),
            linear-gradient(90deg, hsl(var(--cyan) / 0.3) 50%, transparent 50%),
            linear-gradient(0deg, hsl(var(--cyan) / 0.3) 50%, transparent 50%),
            linear-gradient(0deg, hsl(var(--cyan) / 0.3) 50%, transparent 50%)
          `,
          backgroundSize: isDragging ? undefined : '12px 2px, 12px 2px, 2px 12px, 2px 12px',
          backgroundPosition: isDragging ? undefined : '0 0, 0 100%, 0 0, 100% 0',
          animation: isDragging ? undefined : 'borderDance 1s linear infinite',
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Upload className="w-16 h-16 mx-auto mb-6 text-cyan" />
        </motion.div>
        <p className="text-lg font-semibold mb-3">Drag & drop or click to upload</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Image className="w-4 h-4" /> JPG, PNG</span>
          <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> PDF</span>
          <span className="flex items-center gap-1"><Film className="w-4 h-4" /> MP4</span>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-3">Max 10MB</p>
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
