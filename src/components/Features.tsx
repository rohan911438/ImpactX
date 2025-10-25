import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Camera, Blocks, Gift, Globe, Sparkles } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Proof-first",
    description: "Upload photos or short clips. We guide you on capturing clear, verifiable moments.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted",
    description: "Smart checks assess content quality and detect common spoofing patterns.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-respecting",
    description: "We minimize personally identifiable data and keep verification on a need-to-know basis.",
  },
  {
    icon: Blocks,
    title: "On-chain receipts",
    description: "Each verified action is recorded on Celo so your impact is portable and provable.",
  },
  {
    icon: Gift,
    title: "Rewards that matter",
    description: "Earn PoI NFTs and cUSD rewards; redeem and showcase across your favorite apps.",
  },
  {
    icon: Globe,
    title: "Global by default",
    description: "Works everywhere. Join a community making local actions visible worldwide.",
  },
];

export const Features = () => {
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
            Why builders choose <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ImpactX</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A modern stack for verifiable real-world actions with delightful UX
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="p-6 glass-effect h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
