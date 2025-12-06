import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Cpu, FileCheck, Lock, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drag & drop any image, video, screenshot, or document",
    details: ["Images: JPG, PNG, WebP", "Videos: MP4, MOV", "Documents: PDF"],
    color: "from-cyan to-blue-500",
  },
  {
    icon: Cpu,
    title: "Analyze",
    description: "Multi-layer forensic engine examines 47+ manipulation indicators",
    details: [
      "Computer vision algorithms (ELA, FFT)",
      "AI artifact detection (CNN, transformers)",
      "Template matching & structural analysis",
      "Metadata & file signature forensics",
    ],
    color: "from-purple to-pink-500",
  },
  {
    icon: FileCheck,
    title: "Understand",
    description: "Get clear, actionable results",
    details: [
      "Authenticity score",
      "Visual anomaly highlights",
      "Creation pathway reconstruction",
      "Risk assessment & recommendation",
    ],
    color: "from-green-500 to-emerald-400",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple/5 rounded-full blur-[180px]" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <Cpu className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Forensic-Grade Analysis,{" "}
            <span className="text-gradient-vibrant">Simple Interface</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 relative">
          {/* Animated connecting lines */}
          <div className="hidden md:block absolute top-24 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-1">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan via-purple to-green-500 rounded-full origin-left"
              style={{ 
                backgroundSize: '200% 100%',
                animation: isInView ? 'gradient-shift 3s ease infinite' : 'none'
              }}
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="glass-card rounded-3xl p-8 h-full relative hover-lift">
                {/* Step number - Large gradient circle */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3, type: "spring" }}
                  className={`absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-xl font-bold text-background shadow-lg`}
                >
                  {index + 1}
                </motion.div>

                {/* Icon - Larger */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mt-6 mb-6 mx-auto`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-foreground" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4 text-center">{step.title}</h3>
                <p className="text-muted-foreground mb-6 text-center text-base">{step.description}</p>

                {/* Details */}
                <ul className="space-y-3">
                  {step.details.map((detail, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.2 + i * 0.1 + 0.5 }}
                      className="text-sm text-muted-foreground/80 flex items-start gap-3"
                    >
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.color} mt-1.5 shrink-0`} />
                      {detail}
                    </motion.li>
                  ))}
                </ul>

                {/* Arrow to next step (mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-6">
                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl glass-card">
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-cyan" />
            </div>
            <span className="text-muted-foreground">
              All processing happens securely. Your content is never stored.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}