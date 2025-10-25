import { Upload, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "Upload Proof",
    description: "Take a photo or video of your positive action - planting trees, helping others, cleaning up, teaching, or any good deed.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "AI Verification",
    description: "Our AI analyzes your proof in seconds, verifying authenticity and impact while maintaining your privacy.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Award,
    title: "Earn Rewards",
    description: "Receive unique NFTs and tokens on Celo blockchain. Your impact is forever recorded and rewarded on-chain.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            How It <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to turn your real-world actions into verifiable on-chain impact
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="p-8 h-full glass-effect hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                {/* Step Number */}
                <div className="absolute top-4 right-4 text-6xl font-bold opacity-5 group-hover:opacity-10 transition-opacity">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`${step.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connecting Line (not on last card) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
