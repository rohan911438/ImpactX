import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Share2, Sparkles } from "lucide-react";

type Achievement = { key: string; label: string };
type TopAction = { action: string; count: number };
type ProfileTotals = { totalImpacts: number; totalRewards: string; avgScore: number };
type ProfileData = {
  wallet: string;
  totals: ProfileTotals;
  streakDays: number;
  achievements: Achievement[];
  topActions: TopAction[];
};

const Profile = () => {
  const { wallet = "" } = useParams();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/profile/${wallet}`);
        if (!res.ok) throw new Error("Failed to load");
        const d: ProfileData = await res.json();
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [wallet]);

  const share = () => {
    const url = `${window.location.origin}/u/${wallet}`;
    const text = `Check out my ImpactX profile and verified impacts: ${url}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Public Profile</h1>
          <p className="text-muted-foreground">Wallet: <span className="font-mono">{wallet}</span></p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading profile...</p>
        ) : !data ? (
          <p className="text-red-500">Failed to load profile.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Your verified impact at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Total Impacts</p>
                    <p className="text-3xl font-bold">{data.totals.totalImpacts}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Total Rewards</p>
                    <p className="text-3xl font-bold text-accent">{data.totals.totalRewards} cUSD</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Avg AI Score</p>
                    <p className="text-3xl font-bold text-primary">{data.totals.avgScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{data.streakDays} days</p>
                <p className="text-muted-foreground">Consecutive days with verified impact</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {data.achievements.length ? (
                  <div className="flex flex-wrap gap-2">
                    {data.achievements.map((a) => (
                      <Badge key={a.key} variant="outline" className="gap-2">
                        <Award className="w-4 h-4" />
                        {a.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No achievements yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topActions.length ? (
                  <div className="space-y-2">
                    {data.topActions.map((t) => (
                      <div key={t.action} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span>{t.action}</span>
                        <Badge variant="secondary">{t.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No verified actions.</p>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-3">
              <Button onClick={share} className="gap-2"><Share2 className="w-4 h-4"/> Share Profile</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
