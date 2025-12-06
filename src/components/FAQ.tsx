import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "How accurate is TrustLens?",
    answer:
      "Our multi-layer forensic engine achieves 94%+ accuracy on known manipulation types. We combine multiple detection methods to minimize false positives.",
    icon: "🎯",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Content is analyzed securely and deleted immediately after verification. We never store or access your private data.",
    icon: "🔒",
  },
  {
    question: "What file types are supported?",
    answer:
      "Images (JPG, PNG, WebP), Videos (MP4, MOV), Documents (PDF), Screenshots (all formats).",
    icon: "📁",
  },
  {
    question: "Can TrustLens detect all manipulation?",
    answer:
      "We detect most common manipulation techniques including AI generation, photo editing, screenshot forgery, and document alteration. No detector is 100%, but we provide probability scores and detailed analysis.",
    icon: "🔍",
  },
  {
    question: "Do I need technical knowledge?",
    answer:
      "No. TrustLens is built for everyone. Upload content, get clear results with visual explanations.",
    icon: "👤",
  },
  {
    question: "How is this different from other AI detectors?",
    answer:
      "Most tools only detect AI-generated images. TrustLens verifies ALL digital content including screenshots, documents, and videos. We also show HOW content was created and WHAT risks it poses.",
    icon: "⚡",
  },
  {
    question: "Can I use this for legal purposes?",
    answer:
      "TrustLens provides forensic analysis, but results should be reviewed by experts for legal matters. We provide detailed technical reports for professional review.",
    icon: "⚖️",
  },
];

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[180px]" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div ref={ref} className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <MessageCircle className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Common <span className="text-gradient-vibrant">Questions</span>
          </h2>
        </motion.div>

        {/* FAQ Accordion - Card style with blue theme */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden transition-all duration-300 border border-border/50 hover:border-cyan/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center gap-4 text-left hover:bg-cyan/5 transition-colors"
              >
                {/* Question mark icon */}
                <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">{faq.icon}</span>
                </div>
                <span className="font-semibold flex-1 text-base md:text-lg">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-cyan shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pl-20">
                  <div className="p-4 rounded-xl bg-cyan/5 border border-cyan/10">
                    <p className="text-base text-muted-foreground leading-[1.7]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}