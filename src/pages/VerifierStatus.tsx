import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, Brain } from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";
type VerificationRequest = {
  id: string;
  wallet: string;
  action: string;
  status: VerificationStatus;
  aiScore: number | null;
  timestamp: string;
  ipfsHash: string;
  impactId: string;
};

const VerifierStatus = () => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/verifications');
        if (!res.ok) throw new Error('Failed to load');
        const data: { requests: VerificationRequest[] } = await res.json();
        setVerificationRequests(data.requests || []);
      } catch {
        setVerificationRequests([]);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: "bg-green-500/20 text-green-500 border-green-500/30",
      rejected: "bg-red-500/20 text-red-500 border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const stats = useMemo(() => {
    const total = verificationRequests.length;
    const verified = verificationRequests.filter((r) => r.status === "verified").length;
    const pending = verificationRequests.filter((r) => r.status === "pending").length;
    const rejected = verificationRequests.filter((r) => r.status === "rejected").length;
    const scored = verificationRequests.filter((r) => r.aiScore !== null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, r) => sum + (r.aiScore || 0), 0) / scored.length)
      : 0;
    return { total, verified, pending, rejected, avgScore };
  }, [verificationRequests]);
  
  return (
    <div className="min-h-screen bg-background md:pl-64">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" />
            AI Verifier Status
          </h1>
          <p className="text-muted-foreground">Monitor verification requests and AI performance 🤖</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{stats.verified}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg AI Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.avgScore}%</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Verification Requests Table */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Recent Verification Requests</CardTitle>
            <CardDescription>Real-time AI verification processing dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Request ID</th>
                    <th className="text-left p-4 font-semibold">Wallet</th>
                    <th className="text-left p-4 font-semibold">Action Type</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">AI Score</th>
                    <th className="text-left p-4 font-semibold">Timestamp</th>
                    <th className="text-left p-4 font-semibold">IPFS</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold">{request.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{request.wallet}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{request.action}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        {request.aiScore !== null ? (
                          <Badge
                            variant="outline"
                            className={
                              request.aiScore >= 80
                                ? "bg-green-500/20 text-green-500 border-green-500/30"
                                : request.aiScore >= 60
                                ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                : "bg-red-500/20 text-red-500 border-red-500/30"
                            }
                          >
                            {request.aiScore}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{request.timestamp}</span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(`https://ipfs.io/ipfs/${request.ipfsHash}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
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
    </div>
  );
};

export default VerifierStatus;
