import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

type PublicMetrics = {
  totals: { verifiedActions: number; uniqueWallets: number; totalRewards: number };
  weeklyTimeSeries: Array<{ week: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  topWallets: Array<{ wallet: string; points: number }>;
};

const Metrics = () => {
  const [data, setData] = useState<PublicMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/metrics');
  const d: PublicMetrics = await res.json();
        setData(d);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Public Metrics</h1>
          <p className="text-muted-foreground">Network-wide, privacy-safe numbers updated live</p>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Actions</CardTitle>
                <CardDescription>Total verified proofs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.totals.verifiedActions.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Makers</CardTitle>
                <CardDescription>Unique wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.totals.uniqueWallets.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rewards Paid</CardTitle>
                <CardDescription>cUSD equivalent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.totals.totalRewards.toFixed(2)} cUSD</div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Verifications</CardTitle>
                <CardDescription>Counts per week</CardDescription>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weeklyTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" hide={false} minTickGap={16} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
                <CardDescription>Most frequent categories</CardDescription>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byAction}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" hide={false} minTickGap={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Top Wallets (by AI Points)</CardTitle>
                <CardDescription>Leaders by cumulative AI score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.topWallets.map((w) => (
                    <div key={w.wallet} className="p-4 rounded-lg border border-border">
                      <div className="font-mono text-sm">{w.wallet.slice(0,6)}...{w.wallet.slice(-4)}</div>
                      <div className="text-lg font-semibold">{w.points}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-destructive">Failed to load metrics.</div>
        )}
      </div>
    </div>
  );
};

export default Metrics;
