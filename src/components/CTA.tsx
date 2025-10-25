import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-10 md:p-16 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 border border-border/50 text-center"
        >
          <h3 className="text-4xl md:text-5xl font-bold mb-4">Ready to turn your actions into impact?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Start with one small action today. Verify it in minutes. Inspire many.</p>
          <Button size="lg" className="gap-2" onClick={() => navigate('/dashboard')}>
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
