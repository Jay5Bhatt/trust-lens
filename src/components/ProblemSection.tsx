import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, Users, Banknote, Bot } from "lucide-react";

const stats = [
  { value: 17, suffix: "M+", label: "fake UPI transactions annually in India", icon: Banknote, color: "from-red-500 to-orange-500" },
  { value: 73, suffix: "%", label: "of students can't identify fake screenshots", icon: Users, color: "from-purple to-pink-500" },
  { value: 12000, suffix: " Cr", prefix: "₹", label: "lost to digital fraud in 2024", icon: TrendingUp, color: "from-yellow-500 to-orange-500" },
  { value: 89, suffix: "%", label: "of AI-generated content goes undetected", icon: Bot, color: "from-cyan to-blue-500" },
];

function AnimatedCounter({ value, suffix, prefix = "" }: { value: number; suffix: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-gradient">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const fakeExamples = [
  { 
    type: "UPI Slip", 
    status: "MANIPULATED",
    preview: "₹15,000 transferred...",
    color: "from-red-500/20 to-orange-500/20"
  },
  { 
    type: "WhatsApp Chat", 
    status: "FORGED",
    preview: "Meeting at 5pm...",
    color: "from-green-500/20 to-emerald-500/20"
  },
  { 
    type: "AI Image", 
    status: "GENERATED",
    preview: "Portrait photo...",
    color: "from-purple/20 to-pink-500/20"
  },
];

export function ProblemSection() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-navy-light/40 to-background" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div ref={containerRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">The Problem</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15]">
              Digital Truth is{" "}
              <span className="text-destructive">Disappearing</span>
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-5 md:p-6 hover-lift group"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} p-0.5 mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Problem narrative */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-3xl p-8 md:p-10 space-y-6">
              <p className="text-lg text-muted-foreground leading-[1.8]">
                AI has made manipulation effortless.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 font-semibold">Fake UPI slips.</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 font-semibold">Forged school notices.</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400 font-semibold">Edited WhatsApp chats.</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 font-semibold">Deepfake videos.</span>{" "}
                Everyone is vulnerable—students, teachers, parents, small businesses.
              </p>

              <p className="text-lg text-muted-foreground leading-[1.8]">
                Existing AI detectors only catch obvious fakes. They can't detect fake screenshots, 
                altered documents, or sophisticated manipulation. They can't tell you{" "}
                <span className="text-cyan font-semibold">HOW</span> content was created or{" "}
                <span className="text-cyan font-semibold">WHAT</span> risks it poses.
              </p>

              <div className="pt-6 border-t border-border/50">
                <p className="text-xl font-semibold text-foreground">
                  The world desperately needs a{" "}
                  <span className="text-gradient-vibrant">shield</span>.
                </p>
              </div>
            </div>

            {/* Fake examples grid - Redesigned with previews */}
            <div className="grid grid-cols-3 gap-4">
              {fakeExamples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="glass-card rounded-2xl p-4 relative group overflow-hidden hover-lift"
                >
                  {/* Preview area with gradient overlay */}
                  <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${example.color} flex items-center justify-center mb-3 relative overflow-hidden`}>
                    {/* Content preview text */}
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <span className="text-[10px] text-muted-foreground/70 text-center line-clamp-2">{example.preview}</span>
                    </div>
                    
                    {/* Scan line effect */}
                    <div className="absolute inset-0 scan-line" />
                    
                    {/* Red tint overlay */}
                    <div className="absolute inset-0 bg-destructive/10" />
                    
                    {/* FAKE stamp */}
                    <div className="fake-stamp text-sm">FAKE</div>
                    
                    {/* Corner ribbon */}
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-destructive/80 rotate-12 flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-white -rotate-12" />
                    </div>
                  </div>
                  
                  <p className="text-sm font-semibold text-center">{example.type}</p>
                  <p className="text-xs text-destructive text-center font-medium">{example.status}</p>
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-destructive/0 group-hover:ring-destructive/30 transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}