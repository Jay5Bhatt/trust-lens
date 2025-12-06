import { motion } from "framer-motion";
import { ArrowRight, Shield, CheckCircle, Sparkles, Users, Building2 } from "lucide-react";
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

          {/* Subheadline - Better spacing */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed"
          >
            AI-powered forensics that verifies images, videos, screenshots, and documents in seconds
          </motion.p>

          {/* Description - Shorter and punchier */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-12"
          >
            TrustLens builds the shield against manipulation, AI generation, and digital fraud.
          </motion.p>

          {/* CTA Button - Single, larger, more prominent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
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

          {/* Trust indicators - Enhanced with colors and larger icons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-10 lg:gap-12"
          >
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-cyan/10 flex items-center justify-center animate-icon-pulse">
                <CheckCircle className="w-5 h-5 text-cyan" />
              </div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Used by educators</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center animate-icon-pulse" style={{ animationDelay: '0.5s' }}>
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Trusted by businesses</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple/20 to-purple/10 flex items-center justify-center animate-icon-pulse" style={{ animationDelay: '1s' }}>
                <Users className="w-5 h-5 text-purple" />
              </div>
              <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Built for everyone</span>
            </div>
          </motion.div>
        </div>

        {/* Floating accent card - Only one, minimal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 relative flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="glass-card rounded-2xl px-6 py-4 shadow-lg inline-flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
              <Shield className="w-6 h-6 text-background" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gradient">94%+</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-cyan" />
        </motion.div>
      </motion.div>
    </section>
  );
}