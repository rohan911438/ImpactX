import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, TrendingUp, Award, Loader2, ExternalLink, Share2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useChainId, useSignTypedData } from "wagmi";
import { domain as claimDomain, types as claimTypes, toBytes32, type ImpactClaim } from "@/lib/attest";

const Dashboard = () => {
  const { toast } = useToast();
  const wagmiAccount = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const [isVerifying, setIsVerifying] = useState(false);
  const [actionType, setActionType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [myReferral, setMyReferral] = useState<string | null>(null);
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);
  
  // Mock user data - in real app, this would come from blockchain/backend
  const userData = {
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    balance: "125.50",
    impactScore: 847,
    totalRewards: "125.50",
    nftsMinted: 12,
  };
  
  type ApiImpact = {
    id: string;
    actionType: string;
    aiScore?: number | null;
    createdAt: number | string;
    reward?: string | number | null;
    nftMinted?: boolean;
    image: string;
  };
  type ImpactItem = {
    id: string;
    type: string;
    score: number;
    date: string;
    reward: string;
    nftMinted: boolean;
    image: string;
  };
  const [impacts, setImpacts] = useState<ImpactItem[]>([]);

  // Resolve active wallet address (prefer connected wallet, fallback to mock)
  const activeWallet = useMemo(
    () => wagmiAccount.address || userData.walletAddress,
    [wagmiAccount.address, userData.walletAddress]
  );

  // Load impacts from backend (fallback to mock if API unreachable)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/impacts?walletAddress=${activeWallet}`);
        if (!res.ok) throw new Error('Failed');
        const data: { impacts?: ApiImpact[] } = await res.json();
        const mapped: ImpactItem[] = (data.impacts || []).map((i: ApiImpact) => ({
          id: i.id,
          type: i.actionType,
          score: Number(i.aiScore ?? 0),
          date: new Date(i.createdAt).toISOString().split('T')[0],
          reward: String(i.reward ?? "0.00"),
          nftMinted: Boolean(i.nftMinted),
          image: i.image,
        }));
        setImpacts(mapped);
      } catch {
        // noop
      }
    };
    load();
  }, [activeWallet]);

  // Capture referral code from URL once and store locally
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('impactx_ref', ref);
        setAppliedReferral(ref);
        toast({ title: 'Referral applied', description: 'Thanks! Your contributions will credit the referrer.' });
      } else {
        const existing = localStorage.getItem('impactx_ref');
        if (existing) setAppliedReferral(existing);
      }
  } catch { /* noop */ }
  }, [toast]);
  
  const leaderboardPreview = [
    { rank: 1, name: "EcoWarrior.eth", points: 2547 },
    { rank: 2, name: "GreenHero.eth", points: 1823 },
    { rank: 3, name: "You", points: 847 },
  ];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleAttest = async (impact: ImpactItem) => {
    try {
      if (!wagmiAccount.address) throw new Error('Connect wallet to attest');
      const msg: ImpactClaim = {
        wallet: wagmiAccount.address,
        impactId: impact.id,
        actionType: impact.type,
        aiScore: Number(impact.score || 0),
        createdAt: Date.now(),
        imageHash: toBytes32(impact.image.length.toString(16)),
        locationHash: toBytes32('0x'),
        descriptionHash: toBytes32((impact.type + impact.date).length.toString(16)),
        chainId: Number(chainId || 42220),
      };
      const signature = await signTypedDataAsync({
        domain: claimDomain(msg.chainId),
        types: claimTypes as unknown as Record<string, readonly { name: string; type: string }[]>,
        primaryType: 'ImpactClaim',
        message: msg,
      });
      const res = await fetch('/api/attestations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, signature, chainId: msg.chainId }),
      });
      if (!res.ok) throw new Error('Failed to record attestation');
      toast({ title: 'Attested', description: 'Your ImpactClaim attestation is recorded.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Could not attest', description: msg, variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!file || !actionType) {
      toast({
        title: "Missing Information",
        description: "Please upload a photo and select an action type",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      form.append('walletAddress', activeWallet);
      form.append('actionType', actionType);
      form.append('description', description);
      const ref = localStorage.getItem('impactx_ref');
      if (ref) form.append('referralCode', ref);
      const res = await fetch('/api/impacts', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const i = data.impact;
      const newImpact = {
        id: i.id,
        type: i.actionType,
        score: i.aiScore ?? 0,
        date: new Date(i.createdAt).toISOString().split('T')[0],
        reward: i.reward ?? "0.00",
        nftMinted: Boolean(i.nftMinted),
        image: i.image,
      };
      setImpacts([newImpact, ...impacts]);
      toast({ title: "Submitted!", description: "AI verification in progress..." });
      // Refresh list after a short delay to reflect verification
      setTimeout(async () => {
        try {
          const res2 = await fetch(`/api/impacts?walletAddress=${activeWallet}`);
          if (res2.ok) {
            const d2 = await res2.json();
            const mapped: ImpactItem[] = (d2.impacts || []).map((j: ApiImpact) => ({
              id: j.id,
              type: j.actionType,
              score: Number(j.aiScore ?? 0),
              date: new Date(j.createdAt).toISOString().split('T')[0],
              reward: String(j.reward ?? "0.00"),
              nftMinted: Boolean(j.nftMinted),
              image: j.image,
            }));
            setImpacts(mapped);
          }
        } catch { /* noop */ }
      }, 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
      setFile(null);
      setActionType("");
      setDescription("");
    }
  };

  const createReferral = async () => {
    try {
      const res = await fetch('/api/referral/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: activeWallet }),
      });
      if (!res.ok) throw new Error('Failed to create referral');
      const data = await res.json();
      setMyReferral(data.code);
      toast({ title: 'Referral ready', description: 'Share your link to invite friends.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Could not create referral', description: msg, variant: 'destructive' });
    }
  };

  const shareUrl = useMemo(() => {
    const code = myReferral || '';
    if (!code) return '';
    const base = window.location.origin;
    return `${base}/?ref=${code}`;
  }, [myReferral]);
  
  return (
    <div className="min-h-screen bg-background md:pl-64">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Panel */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-hero bg-clip-text text-transparent">{userData.walletAddress.slice(0, 8)}...</span> 🌍
          </h1>
          <p className="text-muted-foreground">Track your impact and continue making a difference</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">{userData.impactScore}</div>
              <p className="text-xs text-muted-foreground mt-1">+127 from last month</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{userData.totalRewards} cUSD</div>
              <p className="text-xs text-muted-foreground mt-1">Earned through verified impacts</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PoI NFTs Minted</CardTitle>
              <Award className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{userData.nftsMinted}</div>
              <p className="text-xs text-muted-foreground mt-1">Proof-of-Impact certificates</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Proof Panel */}
            <Card className="glass-effect glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Proof of Impact
                </CardTitle>
                <CardDescription>Submit your action for AI verification and earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="photo">Photo Evidence *</Label>
                  <Input 
                    id="photo" 
                    type="file" 
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                  {file && <p className="text-sm text-muted-foreground mt-1">Selected: {file.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="action-type">Action Type *</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger id="action-type" className="mt-2">
                      <SelectValue placeholder="Select action type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tree Planting">🌳 Tree Planting</SelectItem>
                      <SelectItem value="Teaching">📚 Teaching</SelectItem>
                      <SelectItem value="Recycling">♻️ Recycling</SelectItem>
                      <SelectItem value="Beach Cleanup">🏖️ Beach Cleanup</SelectItem>
                      <SelectItem value="Community Garden">🌱 Community Garden</SelectItem>
                      <SelectItem value="Custom">✨ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description or Location (optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Tell us more about your impact..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={isVerifying}
                  className="w-full"
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI verifying your proof...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* My Impact Section */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>My Impact History</CardTitle>
                <CardDescription>Your verified contributions to making the world better</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {impacts.map((impact) => (
                    <div key={impact.id} className="flex gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <img src={impact.image} alt={impact.type} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{impact.type}</h4>
                            <p className="text-sm text-muted-foreground">{impact.date}</p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            AI: {impact.score}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-accent font-semibold">+{impact.reward} cUSD</span>
                          {impact.nftMinted && (
                            <Badge variant="outline" className="gap-1">
                              <Award className="w-3 h-3" />
                              NFT Minted
                            </Badge>
                          )}
                          {impact.score >= 0 && (
                            <Button size="sm" variant="outline" onClick={() => handleAttest(impact)}>
                              Create Attestation
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {/* Referral Panel */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Invite & Earn</CardTitle>
                <CardDescription>Share your referral link. Earn when your referrals get verified.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appliedReferral && (
                  <div className="text-xs text-muted-foreground">
                    Referral applied: <span className="font-mono">{appliedReferral}</span>
                  </div>
                )}
                {!myReferral ? (
                  <Button onClick={createReferral} className="w-full gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Get my referral link
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">Your link:</div>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={shareUrl} />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
                        }}
                      >Copy</Button>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() => {
                        const text = `Join me on ImpactX and earn by doing good: ${shareUrl}`;
                        if (navigator.share) {
                          navigator.share({ title: 'ImpactX', text, url: shareUrl }).catch(() => { /* noop */ });
                        } else {
                          navigator.clipboard.writeText(text);
                          toast({ title: 'Share text copied', description: 'Paste it anywhere to share.' });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rewards Panel */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>My Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-2">Total Earned</p>
                  <p className="text-4xl font-bold text-accent">{userData.totalRewards}</p>
                  <p className="text-sm text-muted-foreground">cUSD</p>
                </div>
                <Button variant="default" className="w-full" size="lg">
                  Claim Rewards 💰
                </Button>
              </CardContent>
            </Card>
            
            {/* Leaderboard Preview */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top Impact Makers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboardPreview.map((entry) => (
                  <div 
                    key={entry.rank} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.name === "You" ? "bg-primary/10 border border-primary/30" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{entry.rank}</span>
                      <span className="text-sm">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-primary">{entry.points}</span>
                  </div>
                ))}
                <Link to="/leaderboard">
                  <Button variant="outline" className="w-full gap-2">
                    View Full Leaderboard
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
