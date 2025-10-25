import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What counts as proof?", a: "Clear photos or short videos of your action. Add a brief description or location for context." },
  { q: "How does AI verify?", a: "Our models check visual consistency and context. A human-in-the-loop can spot-check flagged items." },
  { q: "What do I earn?", a: "You receive PoI NFTs and cUSD rewards for verified actions. Rewards may vary by challenge or partner." },
  { q: "Do I need a wallet?", a: "You can browse without one. To receive rewards on Celo, connect MetaMask or use WalletConnect." },
];

export const FAQ = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4">FAQ</h2>
          <p className="text-muted-foreground">Everything you need to know to get started</p>
        </motion.div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
