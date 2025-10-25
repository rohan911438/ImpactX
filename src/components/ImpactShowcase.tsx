import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreePine, Users, Trash2, BookOpen, Heart, Droplets } from "lucide-react";

const impactCards = [
  {
    icon: TreePine,
    title: "Tree Planting",
    user: "Sarah M.",
    impact: "50 trees planted",
    location: "Kenya",
    verified: true,
    color: "text-accent",
  },
  {
    icon: Users,
    title: "Community Teaching",
    user: "Marcus K.",
    impact: "30 students taught",
    location: "Brazil",
    verified: true,
    color: "text-primary",
  },
  {
    icon: Trash2,
    title: "Beach Cleanup",
    user: "Aisha P.",
    impact: "200kg waste removed",
    location: "Indonesia",
    verified: true,
    color: "text-secondary",
  },
  {
    icon: BookOpen,
    title: "Library Building",
    user: "David L.",
    impact: "1 library built",
    location: "Ghana",
    verified: true,
    color: "text-accent",
  },
  {
    icon: Heart,
    title: "Food Distribution",
    user: "Elena R.",
    impact: "500 meals served",
    location: "Philippines",
    verified: true,
    color: "text-primary",
  },
  {
    icon: Droplets,
    title: "Clean Water",
    user: "James T.",
    impact: "Well restored",
    location: "India",
    verified: true,
    color: "text-secondary",
  },
];

export const ImpactShowcase = () => {
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
            Real Impact. <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Real People.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands making a difference and earning recognition for their actions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {impactCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 glass-effect hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-card to-card/50 group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  {card.verified && (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      Verified
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-2xl font-bold text-primary mb-3">{card.impact}</p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-medium">{card.user}</span>
                  <span>{card.location}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span>NFT Minted · On Celo Chain</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Your impact could be here next. Start making a difference today.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
