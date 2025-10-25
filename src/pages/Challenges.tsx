import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

const Challenges = () => {
  const { address } = useAccount();
  type Challenge = { id: string; title: string; actionType: string; target: number; week: string };
  type ApiImpact = { status?: string; actionType?: string };
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [impacts, setImpacts] = useState<ApiImpact[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const demoWallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
        const targetWallet = address || demoWallet;
        const [c, i]: [{ challenges?: Challenge[] }, { impacts?: ApiImpact[] }] = await Promise.all([
          fetch('/api/challenges').then(r => r.json()),
          fetch(`/api/impacts?walletAddress=${targetWallet}`).then(r => r.json()),
        ]);
        setChallenges(c.challenges || []);
        setImpacts(i.impacts || []);
      } catch {
        setChallenges([]);
        setImpacts([]);
      }
    };
    load();
  }, [address]);

  const progress = useMemo(() => challenges.map((ch) => {
    const count = impacts.filter((i) => i.status === 'verified' && i.actionType === ch.actionType).length;
    const pct = Math.min(100, Math.round((count / ch.target) * 100));
    return { ...ch, count, pct, done: count >= ch.target };
  }), [challenges, impacts]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Weekly Challenges</h1>
          <p className="text-muted-foreground">Complete quests and climb the leaderboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progress.map(ch => (
            <Card key={ch.id} className={ch.done ? 'border-green-500/40' : ''}>
              <CardHeader>
                <CardTitle>{ch.title}</CardTitle>
                <CardDescription>{ch.actionType} • Target: {ch.target} • Week: {ch.week}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={ch.pct} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{ch.count} / {ch.target} verified</span>
                  {ch.done ? (
                    <span className="text-sm text-green-600">Completed</span>
                  ) : (
                    <Button size="sm" onClick={() => window.location.assign('/dashboard')}>Submit Impact</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
