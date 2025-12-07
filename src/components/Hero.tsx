import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Sparkles, Users, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { ParticleField } from "./ParticleField";

export function Hero() {
  const scrollToDemo = () => {
    document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <ParticleField />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Enhanced radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-cyan/8 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-purple/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-glow/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          {/* Badge - More subtle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card mb-10"
          >
            <Sparkles className="w-3 h-3 text-cyan" />
            <span className="text-xs text-muted-foreground font-medium">AI-Powered Digital Forensics</span>
          </motion.div>

          {/* Main headline - Larger with better spacing */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
          >
            <span className="text-foreground">See Through</span>
            <br />
            <span className="text-gradient-vibrant glow-text">Digital Deception</span>
          </motion.h1>

          {/* Subheadline - Shortened */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Instant truth verification for any digital content—in seconds
          </motion.p>

          {/* CTA Button - Single, larger, more prominent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={scrollToDemo}
              className="text-lg px-10 py-7 beam-button group shadow-glow-intense hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1"
            >
              Try It Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Trust indicators - Enhanced with colors, larger icons (20% bigger), pulse animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-10 lg:gap-12"
          >
            <div className="flex items-center gap-3 group">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-cyan/10 flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-cyan" />
              </motion.div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Used by educators</span>
            </div>
            <div className="flex items-center gap-3 group">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center"
              >
                <Building2 className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Trusted by businesses</span>
            </div>
            <div className="flex items-center gap-3 group">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple/20 to-purple/10 flex items-center justify-center"
              >
                <Users className="w-6 h-6 text-purple" />
              </motion.div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Built for everyone</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}