import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export const Stats = () => {
  const [totals, setTotals] = useState({
    verified: 0,
    participants: 0,
    rewards: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [lb, ver]: [
          { leaderboard?: Array<{ rewardsEarned?: string | number }> },
          { requests?: Array<{ status?: string }> }
        ] = await Promise.all([
          fetch('/api/leaderboard').then(r => r.json()),
          fetch('/api/verifications').then(r => r.json()),
        ]);
        const participants = Array.isArray(lb?.leaderboard) ? lb.leaderboard.length : 0;
        const verified = Array.isArray(ver?.requests) ? ver.requests.filter((x) => x.status === 'verified').length : 0;
        const rewards = Array.isArray(lb?.leaderboard)
          ? lb.leaderboard.reduce((s, row) => s + Number(row.rewardsEarned || 0), 0)
          : 0;
        setTotals({ verified, participants, rewards });
      } catch {
        // non-blocking
      }
    };
    load();
  }, []);

  const items = [
    { label: 'Verified Actions', value: totals.verified.toLocaleString(), suffix: '' },
    { label: 'Impact Makers', value: totals.participants.toLocaleString(), suffix: '' },
    { label: 'Rewards Paid', value: totals.rewards.toFixed(2), suffix: ' cUSD' },
  ];

  return (
    <section className="py-20 bg-muted/20 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="p-8 text-center glass-effect">
                <div className="text-4xl font-bold">
                  {it.value}<span className="text-accent">{it.suffix}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">{it.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
