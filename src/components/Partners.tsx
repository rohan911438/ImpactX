import { motion } from "framer-motion";

const partners = ["Celo", "UN SDGs", "Local NGOs", "Eco DAOs", "Universities"];

export const Partners = () => {
  return (
    <section className="py-16 bg-card/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground mb-6">Supported by</div>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          {partners.map((p, i) => (
            <motion.div
              key={p}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="px-4 py-2 rounded-lg border border-border/50 bg-background/40"
            >
              {p}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
