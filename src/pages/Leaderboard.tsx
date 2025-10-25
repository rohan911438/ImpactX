import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trophy, Medal, Award, Eye } from "lucide-react";

type LeaderboardNFT = { id: string | number; type: string; score: number };
type LeaderboardRow = {
  rank: number;
  username: string;
  wallet: string;
  impactPoints: number;
  actionsVerified: number;
  rewardsEarned: string;
  nfts?: LeaderboardNFT[];
};

const Leaderboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<LeaderboardRow | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [currentUserWallet] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data: { leaderboard: LeaderboardRow[] } = await res.json();
        setRows(data.leaderboard || []);
      } catch {
        setRows([]);
      }
    };
    load();
  }, []);

  const filteredData = useMemo(
    () =>
      rows.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.wallet.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [rows, searchQuery],
  );
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-xl font-bold text-muted-foreground">{rank}</span>;
  };
  
  return (
    <div className="min-h-screen bg-background md:pl-64">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-primary" />
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground">Top impact makers from around the world 🌍</p>
        </div>
        
        <Card className="glass-effect mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by username or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardHeader>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Rank</th>
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">Impact Points</th>
                    <th className="text-left p-4 font-semibold">Actions Verified</th>
                    <th className="text-left p-4 font-semibold">Rewards Earned</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((user) => (
                    <tr
                      key={user.wallet}
                      className={`border-b border-border hover:bg-muted/20 transition-colors ${
                        user.wallet === currentUserWallet ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(user.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {user.wallet.slice(0, 10)}...{user.wallet.slice(-8)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="gap-1 bg-primary/10 border-primary/30">
                          <Award className="w-3 h-3" />
                          {user.impactPoints}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{user.actionsVerified}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-accent">{user.rewardsEarned} cUSD</span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View NFTs
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* NFT Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {selectedUser?.username}'s Proof-of-Impact NFTs
            </DialogTitle>
            <DialogDescription>
              Public collection of verified impact certifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser?.nfts?.length ? (
              selectedUser.nfts.map((nft) => (
                <div key={nft.id} className="p-4 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{nft.type}</p>
                      <p className="text-sm text-muted-foreground">NFT #{nft.id}</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      AI: {nft.score}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No public NFTs available for this user
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
