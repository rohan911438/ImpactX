import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { sponsorPoolAbi } from "@/contracts/sponsorPool.abi";
import { erc20Abi } from "@/contracts/erc20.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { parseUnits, formatUnits } from "viem";

const SponsorPoolPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [recipientsCsv, setRecipientsCsv] = useState("");
  const [weightsCsv, setWeightsCsv] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const pool = CONTRACTS.celoSepolia.SponsorPool as `0x${string}`;

  const { data: owner } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "owner", chainId: CELO_SEPOLIA_ID });
  const isOwner = Boolean(address) && String(owner).toLowerCase() === String(address).toLowerCase();

  const { data: token } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "token", chainId: CELO_SEPOLIA_ID });
  const tokenAddress = token as `0x${string}` | undefined;

  const { data: totalContrib } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "totalContributions", chainId: CELO_SEPOLIA_ID });

  const { data: myContrib } = useReadContract({
    abi: sponsorPoolAbi,
    address: pool,
    functionName: "contributions",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: decimals } = useReadContract({ abi: erc20Abi, address: tokenAddress, functionName: "decimals", chainId: CELO_SEPOLIA_ID, query: { enabled: Boolean(tokenAddress) } });
  const { data: symbol } = useReadContract({ abi: erc20Abi, address: tokenAddress, functionName: "symbol", chainId: CELO_SEPOLIA_ID, query: { enabled: Boolean(tokenAddress) } });
  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", pool],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address && tokenAddress) },
  });

  const { writeContractAsync } = useWriteContract();

  const needApprove = useMemo(() => {
    if (!amount || decimals == null || allowance == null) return true;
    try {
      const want = parseUnits(amount, Number(decimals));
      return BigInt(allowance as bigint) < want;
    } catch {
      return true;
    }
  }, [amount, decimals, allowance]);

  const doApprove = async () => {
    if (!address || !tokenAddress) return toast({ title: "Connect wallet" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const value = parseUnits(amount || "0", Number(decimals ?? 18));
      const hash = await writeContractAsync({ abi: erc20Abi, address: tokenAddress, functionName: "approve", args: [pool, value], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Approve submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Approve failed", description: String(e) });
    }
  };

  const contribute = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const value = parseUnits(amount || "0", Number(decimals ?? 18));
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "contribute", args: [value], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Contribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Contribute failed", description: String(e) });
    }
  };

  const distribute = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const recips = recipientsCsv.split(',').map(s => s.trim()).filter(Boolean) as `0x${string}`[];
      const weights = weightsCsv.split(',').map(s => BigInt(s.trim())).filter(n => !isNaN(Number(n)));
      const total = parseUnits(totalAmount || "0", Number(decimals ?? 18));
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "distribute", args: [recips, weights, total], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Distribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Distribute failed", description: String(e) });
    }
  };

  const withdraw = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const val = parseUnits(withdrawAmount || "0", Number(decimals ?? 18));
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "withdraw", args: [withdrawTo as `0x${string}`, val], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Withdraw submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Withdraw failed", description: String(e) });
    }
  };

  const totalContribFmt = decimals != null ? formatUnits((totalContrib as bigint) || 0n, Number(decimals)) : String(totalContrib || 0);
  const myContribFmt = decimals != null ? formatUnits((myContrib as bigint) || 0n, Number(decimals)) : String(myContrib || 0);

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="glass-effect">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">SponsorPool</CardTitle>
              <CardDescription>Fund and distribute rewards to verified impacts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Celo Sepolia</Badge>
              <Badge variant={isOwner ? 'secondary' : 'outline'}>{isOwner ? 'Owner' : 'Sponsor'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Pool</div>
              <div className="text-sm font-mono break-all">{pool}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all">{String(owner)}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Token</div>
              <div className="text-sm font-mono break-all">{String(tokenAddress)}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Totals</div>
              <div className="text-sm">{totalContribFmt} {String(symbol || '')}</div>
              <div className="text-xs text-muted-foreground">You: {myContribFmt} {String(symbol || '')}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribute</CardTitle>
              <CardDescription>Approve once, then contribute tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount ({String(symbol || '')})</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10.5" />
              </div>
              {needApprove ? (
                <Button onClick={doApprove} className="w-full">Approve</Button>
              ) : (
                <Button onClick={contribute} className="w-full">Contribute</Button>
              )}
              <div className="text-xs text-muted-foreground">Allowance required only when increasing contribution amount.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner actions</CardTitle>
              <CardDescription>Distribute or withdraw pool funds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Recipients (comma-separated)</Label>
                <Input value={recipientsCsv} onChange={(e) => setRecipientsCsv(e.target.value)} placeholder="0xabc...,0xdef..." />
              </div>
              <div>
                <Label>Weights (comma-separated, ints)</Label>
                <Input value={weightsCsv} onChange={(e) => setWeightsCsv(e.target.value)} placeholder="70,30" />
              </div>
              <div>
                <Label>Total Amount ({String(symbol || '')})</Label>
                <Input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="100" />
              </div>
              <Button onClick={distribute} className="w-full">Distribute</Button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label>Withdraw To</Label>
                  <Input value={withdrawTo} onChange={(e) => setWithdrawTo(e.target.value)} placeholder="0x..." />
                </div>
                <div>
                  <Label>Amount ({String(symbol || '')})</Label>
                  <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="5" />
                </div>
              </div>
              <Button variant="outline" onClick={withdraw} className="w-full">Withdraw</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SponsorPoolPage;
