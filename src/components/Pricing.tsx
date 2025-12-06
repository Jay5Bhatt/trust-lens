import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Sparkles, Building, CreditCard, Star } from "lucide-react";
import { Button } from "./ui/button";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    description: "Get started with basic verification",
    features: [
      "10 scans per month",
      "Basic authenticity detection",
      "Image support only",
      "Email support",
    ],
    cta: "Start Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Premium",
    price: "₹99",
    period: "/month",
    description: "Complete forensic analysis for professionals",
    features: [
      "Unlimited scans",
      "Full forensic analysis",
      "All file types (images, videos, docs)",
      "Reality Trace™",
      "TruthScore+ risk assessment",
      "Source Match Shield",
      "Priority processing",
      "Export detailed reports",
    ],
    cta: "Get Premium",
    variant: "glow" as const,
    popular: true,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    description: "Enterprise solutions for organizations",
    features: [
      "Everything in Premium",
      "API access",
      "Team accounts",
      "Custom integrations",
      "Bulk processing",
      "Dedicated support",
      "White-label options",
    ],
    examples: [
      "Schools: ₹499/month per 100 students",
      "Sellers: ₹299/month",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-navy-light/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan/3 rounded-full blur-[180px]" />
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
            <CreditCard className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium text-muted-foreground">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Choose Your <span className="text-gradient-vibrant">Plan</span>
          </h2>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.popular ? "md:-mt-6 md:mb-6 z-10" : ""}`}
            >
              {/* Popular badge - Larger and animated */}
              {plan.popular && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 z-10"
                >
                  <div className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan to-purple text-sm font-bold text-background flex items-center gap-2 shadow-lg animate-pulse-glow">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </div>
                </motion.div>
              )}

              <div
                className={`rounded-3xl p-8 lg:p-10 h-full flex flex-col transition-all duration-500 ${
                  plan.popular
                    ? "gradient-border-animated bg-background shadow-glow-lg scale-105"
                    : "glass-card hover:border-cyan/30 hover-lift"
                }`}
              >
                {/* Plan header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gradient-vibrant">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                  <p className="text-base text-muted-foreground mt-3">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? 'bg-gradient-to-br from-cyan to-purple' : 'bg-cyan/20'}`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-background' : 'text-cyan'}`} />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Examples for business plan */}
                {plan.examples && (
                  <div className="mb-8 p-5 rounded-2xl bg-muted/30 space-y-2 border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Example pricing:
                    </p>
                    {plan.examples.map((example, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {example}
                      </p>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <Button
                  variant={plan.variant}
                  size="lg"
                  className={`w-full text-base py-6 ${plan.popular ? 'beam-button shadow-glow-sm hover:shadow-glow hover:scale-105 transition-all' : ''}`}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-base text-muted-foreground mt-12 flex items-center justify-center gap-2"
        >
          <Building className="w-5 h-5 text-cyan" />
          Special pricing for educational institutions and NGOs
        </motion.p>
      </div>
    </section>
  );
}