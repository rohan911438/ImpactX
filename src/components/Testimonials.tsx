import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const quotes = [
  {
    name: "Aisha, Community Lead",
    text: "ImpactX let us coordinate cleanups and verify them transparently. Our sponsors loved the proof!",
  },
  {
    name: "Diego, Teacher",
    text: "I mentor students on weekends. Getting recognition and a PoI NFT actually boosted attendance!",
  },
  {
    name: "Lena, Dev",
    text: "As a builder, I plugged the on-chain proof into our DAO’s rewards flow in a day. Smooth APIs.",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            What our community <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">says</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from people turning small actions into big change
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {quotes.map((q, i) => (
            <motion.div
              key={q.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="p-6 glass-effect h-full">
                <p className="text-base leading-relaxed">“{q.text}”</p>
                <div className="mt-4 text-sm text-muted-foreground">— {q.name}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
