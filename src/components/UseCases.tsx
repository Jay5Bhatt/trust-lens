import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  GraduationCap,
  Store,
  Users,
  ShoppingBag,
  Share2,
  Palette,
  Target,
  Star,
} from "lucide-react";

const useCases = [
  {
    icon: GraduationCap,
    title: "Students & Teachers",
    description: "Verify assignment screenshots, school notices, exam materials",
    color: "from-blue-500 to-cyan",
    popular: true,
  },
  {
    icon: Store,
    title: "Small Business Owners",
    description: "Authenticate UPI payment slips, transaction proofs, invoices",
    color: "from-green-500 to-emerald-400",
    popular: true,
  },
  {
    icon: Users,
    title: "Parents",
    description: "Check suspicious school messages, fee receipts, announcements",
    color: "from-purple to-pink-500",
  },
  {
    icon: ShoppingBag,
    title: "Online Buyers/Sellers",
    description: "Verify product images, payment confirmations, seller credentials",
    color: "from-orange-500 to-yellow-500",
  },
  {
    icon: Share2,
    title: "Social Media Users",
    description: "Detect fake news, manipulated viral content, deepfake videos",
    color: "from-red-500 to-rose-400",
  },
  {
    icon: Palette,
    title: "Content Creators",
    description: "Protect original work, verify source material, check licensing",
    color: "from-violet-500 to-purple",
  },
];

export function UseCases() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-navy-light/30 to-background" />
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
            <Target className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">Use Cases</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Built For{" "}
            <span className="text-gradient-vibrant">Real-World Protection</span>
          </h2>
        </motion.div>

        {/* Use cases grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group relative ${useCase.popular ? 'sm:scale-105 z-10' : ''}`}
            >
              <div className={`glass-card rounded-3xl p-8 h-full transition-all duration-500 hover:bg-muted/30 hover-lift relative overflow-hidden ${useCase.popular ? 'border-cyan/30 shadow-glow-sm' : 'hover:border-cyan/30'}`}>
                {/* Popular badge */}
                {useCase.popular && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan/20 to-purple/20 border border-cyan/30">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-semibold text-cyan">POPULAR</span>
                  </div>
                )}

                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Icon - Larger with gradient */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                    <useCase.icon className="w-7 h-7 text-foreground group-hover:text-cyan transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-cyan transition-colors">
                  {useCase.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">{useCase.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}