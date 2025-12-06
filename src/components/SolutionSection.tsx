import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Gauge, 
  Search, 
  GitBranch, 
  ShieldAlert, 
  Database, 
  FileStack,
  Sparkles 
} from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Authenticity Score",
    description: "Probability analysis: Real, partially edited, or fully manipulated",
    gradient: "from-cyan to-blue-500",
    bgGlow: "bg-cyan/10",
  },
  {
    icon: Search,
    title: "Anomaly Detection",
    description: "Visual markup of lighting errors, pixel artifacts, UI inconsistencies, shadow violations",
    gradient: "from-purple to-pink-500",
    bgGlow: "bg-purple/10",
  },
  {
    icon: GitBranch,
    title: "Reality Trace™",
    description: "Reconstructs creation history: Camera → Edit → AI → Screenshot",
    gradient: "from-cyan-glow to-cyan",
    bgGlow: "bg-cyan-glow/10",
    trademark: true,
  },
  {
    icon: ShieldAlert,
    title: "TruthScore+™",
    description: "Risk assessment: Financial, social, reputation, or institutional danger",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/10",
    trademark: true,
  },
  {
    icon: Database,
    title: "Source Match Shield",
    description: "Cross-verification against templates, formats, and known sources",
    gradient: "from-green-500 to-emerald-500",
    bgGlow: "bg-green-500/10",
  },
  {
    icon: FileStack,
    title: "Multi-Format Support",
    description: "Images, videos, screenshots, documents, payment proofs",
    gradient: "from-violet-500 to-purple",
    bgGlow: "bg-violet-500/10",
  },
];

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan/5 rounded-full blur-[180px]" />
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
            <Sparkles className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">Our Solution</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            The Complete Digital{" "}
            <span className="text-gradient-vibrant">Forensics Shield</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Not just detection. Complete truth verification.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`glass-card rounded-3xl p-8 h-full transition-all duration-500 hover:bg-muted/30 hover:border-cyan/40 hover-lift relative overflow-hidden ${feature.trademark ? 'ring-1 ring-cyan/20' : ''}`}>
                {/* Background glow on hover */}
                <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl`} />
                
                {/* Icon - Larger with glow */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center relative">
                    <feature.icon className="w-7 h-7 text-foreground group-hover:text-cyan transition-colors" />
                  </div>
                  {/* Icon glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`} />
                </div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold group-hover:text-cyan transition-colors">
                      {feature.title}
                    </h3>
                    {feature.trademark && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-cyan/20 to-purple/20 rounded-full text-cyan border border-cyan/30">
                        PROPRIETARY
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-10`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}