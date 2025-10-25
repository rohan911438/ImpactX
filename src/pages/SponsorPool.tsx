import { useAccount, useChainId, useReadContract, useWriteContract, useSwitchChain, usePublicClient } from "wagmi";
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
import { Skeleton } from "@/components/ui/skeleton";

import { Navigation } from "@/components/Navigation";

const SponsorPoolPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: CELO_SEPOLIA_ID });
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
  const { data: userBal } = useReadContract({ abi: erc20Abi, address: tokenAddress, functionName: "balanceOf", args: [address ?? "0x0000000000000000000000000000000000000000"], chainId: CELO_SEPOLIA_ID, query: { enabled: Boolean(address && tokenAddress) } });
  const { data: poolBal } = useReadContract({ abi: erc20Abi, address: tokenAddress, functionName: "balanceOf", args: [pool], chainId: CELO_SEPOLIA_ID, query: { enabled: Boolean(tokenAddress) } });
  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", pool],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address && tokenAddress) },
  });

  const { writeContractAsync } = useWriteContract();

  // Fee guard: ensure estimated gas fee is < 0.10 CELO before sending
  const ensureFeeBelow = async (estimate: () => Promise<bigint>) => {
    try {
      if (!publicClient) return true; // if no client, skip
      const gas = await estimate();
      const gasPrice = await publicClient.getGasPrice();
      const feeWei = gas * gasPrice;
      // CELO has 18 decimals
      const feeCelo = Number((Number(feeWei) / 1e18)); // quick approximate conversion for threshold check
      if (feeCelo > 0.10) {
        toast({ title: 'Fee too high', description: `Estimated fee ~${feeCelo.toFixed(4)} CELO exceeds 0.10 CELO cap`, variant: 'destructive' });
        return false;
      }
      return true;
    } catch {
      // On estimation errors, allow proceed (user can still decide in wallet)
      return true;
    }
  };

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
    if (!address) return toast({ title: "Connect wallet" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const value = parseUnits(amount || "0", Number(decimals ?? 18));
      const ok = await ensureFeeBelow(async () => {
        if (!publicClient) return 0n as unknown as bigint;
        return await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: tokenAddress,
          data: (await import('viem')).encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [pool, value] }),
        });
      });
      if (!ok) return;
      const hash = await writeContractAsync({ abi: erc20Abi, address: tokenAddress, functionName: "approve", args: [pool, value], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Approve submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Approve failed", description: String(e) });
    }
  };

  const contribute = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const value = parseUnits(amount || "0", Number(decimals ?? 18));
      const ok = await ensureFeeBelow(async () => {
        if (!publicClient) return 0n as unknown as bigint;
        return await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: pool,
          data: (await import('viem')).encodeFunctionData({ abi: sponsorPoolAbi, functionName: 'contribute', args: [value] }),
        });
      });
      if (!ok) return;
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "contribute", args: [value], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Contribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Contribute failed", description: String(e) });
    }
  };

  const distribute = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const recips = recipientsCsv.split(',').map(s => s.trim()).filter(Boolean) as `0x${string}`[];
      const weights = weightsCsv.split(',').map(s => s.trim()).filter(Boolean).map(s => BigInt(s));
      if (recips.length === 0) return toast({ title: "Add recipients" });
      if (recips.length !== weights.length) return toast({ title: "Counts mismatch", description: "Recipients and weights must align" });
      const total = parseUnits(totalAmount || "0", Number(decimals ?? 18));
      const ok = await ensureFeeBelow(async () => {
        if (!publicClient) return 0n as unknown as bigint;
        return await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: pool,
          data: (await import('viem')).encodeFunctionData({ abi: sponsorPoolAbi, functionName: 'distribute', args: [recips, weights, total] }),
        });
      });
      if (!ok) return;
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "distribute", args: [recips, weights, total], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Distribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Distribute failed", description: String(e) });
    }
  };

  const withdraw = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const val = parseUnits(withdrawAmount || "0", Number(decimals ?? 18));
      const ok = await ensureFeeBelow(async () => {
        if (!publicClient) return 0n as unknown as bigint;
        return await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: pool,
          data: (await import('viem')).encodeFunctionData({ abi: sponsorPoolAbi, functionName: 'withdraw', args: [withdrawTo as `0x${string}`, val] }),
        });
      });
      if (!ok) return;
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "withdraw", args: [withdrawTo as `0x${string}`, val], chainId: CELO_SEPOLIA_ID });
      toast({ title: "Withdraw submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Withdraw failed", description: String(e) });
    }
  };

  const totalContribFmt = decimals != null ? formatUnits((totalContrib as bigint) || 0n, Number(decimals)) : String(totalContrib || 0);
  const myContribFmt = decimals != null ? formatUnits((myContrib as bigint) || 0n, Number(decimals)) : String(myContrib || 0);
  const userBalFmt = decimals != null ? formatUnits((userBal as bigint) || 0n, Number(decimals)) : undefined;
  const poolBalFmt = decimals != null ? formatUnits((poolBal as bigint) || 0n, Number(decimals)) : undefined;

  const short = (a?: string) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '—');
  const copy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Unable to write to clipboard' });
    }
  };
  const fillSample = () => {
    setAmount('0.01');
    setRecipientsCsv(address ? address : '0x0000000000000000000000000000000000000000');
    setWeightsCsv('100');
    setTotalAmount('0.01');
  };

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <Navigation />
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
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{pool}</span>
                <Button size="icon" variant="outline" onClick={() => copy(pool)}>⧉</Button>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{owner ? String(owner) : <Skeleton className="h-4 w-40 inline-block align-middle" />}</span>
                {owner && <Button size="icon" variant="outline" onClick={() => copy(String(owner))}>⧉</Button>}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Token</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{tokenAddress ? String(tokenAddress) : <Skeleton className="h-4 w-56 inline-block align-middle" />}</span>
                {tokenAddress && <Button size="icon" variant="outline" onClick={() => copy(String(tokenAddress))}>⧉</Button>}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Totals</div>
              <div className="text-sm">{totalContribFmt} {String(symbol || '')}</div>
              <div className="text-xs text-muted-foreground">You: {myContribFmt} {String(symbol || '')}</div>
              {poolBalFmt && <div className="text-xs text-muted-foreground">Pool balance: {poolBalFmt} {String(symbol || '')}</div>}
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
                <div className="flex items-center gap-2">
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10.5" />
                  <Button size="sm" variant="outline" onClick={() => userBalFmt && setAmount(userBalFmt)}>Max</Button>
                  <Button size="sm" variant="ghost" onClick={fillSample}>Sample</Button>
                </div>
                {address && chainId !== CELO_SEPOLIA_ID && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Wrong network. Switch to Celo Sepolia.</span>
                    <Button size="sm" variant="outline" onClick={() => switchChain({ chainId: CELO_SEPOLIA_ID })}>Switch</Button>
                  </div>
                )}
                {!tokenAddress && <div className="text-xs text-muted-foreground pt-1">Pool token not configured yet.</div>}
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
