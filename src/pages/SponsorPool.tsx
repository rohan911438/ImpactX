import { useAccount, useChainId, useReadContract, useWriteContract, usePublicClient, useConnect } from "wagmi";
import { sponsorPoolAbi } from "@/contracts/sponsorPool.abi";
import { erc20Abi } from "@/contracts/erc20.abi";
import { resolveContracts, saveContracts } from "@/contracts/resolve";
import { useMemo, useState, useEffect } from "react";
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
  const publicClient = usePublicClient();
  const { connectors, connectAsync } = useConnect();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [recipientsCsv, setRecipientsCsv] = useState("");
  const [weightsCsv, setWeightsCsv] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [isContract, setIsContract] = useState<boolean | null>(null);
  const [poolCheckMsg, setPoolCheckMsg] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployToken, setDeployToken] = useState<string>("");
  const [deployOwner, setDeployOwner] = useState<string>("");

  // Resolve default pool from per-chain config with override controls
  const defaults = resolveContracts(chainId);
  const defaultPoolAddress = (defaults.SponsorPool || "") as `0x${string}`;
  const defaultTokenAddress = (defaults.SponsorToken || "") as `0x${string}`;
  const [poolInput, setPoolInput] = useState<string>(() => {
    const c = resolveContracts(chainId);
    return c.SponsorPool || defaultPoolAddress || "";
  });
  const [tokenInput, setTokenInput] = useState<string>(() => {
    const c = resolveContracts(chainId);
    return c.SponsorToken || defaultTokenAddress || "";
  });
  const isHexAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v || "");
  const pool = (isHexAddress(poolInput) ? poolInput : defaultPoolAddress) as `0x${string}`;

  // Sanity check: is there contract code at the pool address?
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !pool) return;
        const code = await publicClient.getCode({ address: pool });
        const ok = !!code && code !== '0x';
        setIsContract(ok);
        setPoolCheckMsg(ok ? null : 'No contract bytecode at this address. Paste the deployed SponsorPool address for this network.');
      } catch (e) {
        setIsContract(null);
        setPoolCheckMsg('Could not fetch contract code. Ensure RPC is reachable.');
      }
    })();
  }, [publicClient, pool, chainId]);

  // Pull backend-configured pool/token for this chain to prefill and hint
  useEffect(() => {
    (async () => {
      try {
        if (!chainId) return;
        const r = await fetch(`/api/pools/config?chainId=${chainId}`);
        if (!r.ok) return;
        const cfg = await r.json();
        if (cfg && cfg.pool && isHexAddress(cfg.pool)) {
          if (!isHexAddress(poolInput)) {
            setPoolInput(cfg.pool);
            if (chainId) saveContracts(chainId, { SponsorPool: cfg.pool });
          }
        }
        if (cfg && cfg.token && isHexAddress(cfg.token)) {
          setBackendTokenHint(cfg.token);
        } else {
          setBackendTokenHint(null);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  // Prefill deploy owner with connected wallet
  useEffect(() => {
    if (address) setDeployOwner(address);
  }, [address]);

  const { data: owner } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "owner", chainId });
  const isOwner = Boolean(address) && String(owner).toLowerCase() === String(address).toLowerCase();

  const { data: token } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "token", chainId });
  const tokenAddress = token as `0x${string}` | undefined;
  const ZERO: `0x${string}` = '0x0000000000000000000000000000000000000000';
  const tokenLooksUnset = !tokenAddress || tokenAddress.toLowerCase() === ZERO.toLowerCase();
  const [backendTokenHint, setBackendTokenHint] = useState<string | null>(null);
  const tokenOverride = isHexAddress(tokenInput) ? (tokenInput as `0x${string}`) : undefined;
  const tokenForUi = (tokenOverride || tokenAddress || backendTokenHint || undefined) as `0x${string}` | undefined;

  const { data: totalContrib } = useReadContract({ abi: sponsorPoolAbi, address: pool, functionName: "totalContributions", chainId });

  const { data: myContrib } = useReadContract({
    abi: sponsorPoolAbi,
    address: pool,
    functionName: "contributions",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId,
    query: { enabled: Boolean(address) },
  });

  const { data: decimals } = useReadContract({ abi: erc20Abi, address: tokenForUi, functionName: "decimals", chainId, query: { enabled: Boolean(tokenForUi) } });
  const { data: symbol } = useReadContract({ abi: erc20Abi, address: tokenForUi, functionName: "symbol", chainId, query: { enabled: Boolean(tokenForUi) } });
  const { data: userBal } = useReadContract({ abi: erc20Abi, address: tokenForUi, functionName: "balanceOf", args: [address ?? "0x0000000000000000000000000000000000000000"], chainId, query: { enabled: Boolean(address && tokenForUi) } });
  const { data: poolBal } = useReadContract({ abi: erc20Abi, address: tokenForUi, functionName: "balanceOf", args: [pool], chainId, query: { enabled: Boolean(tokenForUi) } });
  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: tokenForUi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", pool],
    chainId,
    query: { enabled: Boolean(address && tokenForUi) },
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
    if (!tokenForUi) return toast({ title: "Pool token not set" });
    try {
      const value = parseUnits(amount || "0", Number(decimals ?? 18));
      const ok = await ensureFeeBelow(async () => {
        if (!publicClient) return 0n as unknown as bigint;
        return await publicClient.estimateGas({
          account: address as `0x${string}`,
          to: tokenForUi,
          data: (await import('viem')).encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [pool, value] }),
        });
      });
      if (!ok) return;
      const hash = await writeContractAsync({ abi: erc20Abi, address: tokenForUi, functionName: "approve", args: [pool, value], chainId });
      toast({ title: "Approve submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Approve failed", description: String(e) });
    }
  };

  const contribute = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
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
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "contribute", args: [value], chainId });
      toast({ title: "Contribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Contribute failed", description: String(e) });
    }
  };

  const distribute = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
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
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "distribute", args: [recips, weights, total], chainId });
      toast({ title: "Distribute submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Distribute failed", description: String(e) });
    }
  };

  const withdraw = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
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
      const hash = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: "withdraw", args: [withdrawTo as `0x${string}`, val], chainId });
      toast({ title: "Withdraw submitted", description: String(hash) });
    } catch (e) {
      toast({ title: "Withdraw failed", description: String(e) });
    }
  };

  // One-click: approve (if needed) + contribute + distribute
  const oneClickPay = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (!tokenAddress) return toast({ title: "Pool token not set" });
    try {
      setPaying(true);
      const dec = Number(decimals ?? 18);
      const contribStr = amount?.trim();
      const totalStr = (totalAmount || amount)?.trim();
      if (!contribStr || Number(contribStr) <= 0) return toast({ title: 'Enter contribution amount' });
      if (!totalStr || Number(totalStr) <= 0) return toast({ title: 'Enter total amount for distribution' });

      const contribVal = parseUnits(contribStr, dec);
      const totalVal = parseUnits(totalStr, dec);

      // 1) Approve if needed
      try {
        const currentAllowance = (allowance as bigint) ?? 0n;
        if (currentAllowance < contribVal) {
          const tx1 = await writeContractAsync({ abi: erc20Abi, address: tokenAddress, functionName: 'approve', args: [pool, contribVal], chainId });
          toast({ title: 'Approve submitted', description: String(tx1) });
          await publicClient?.waitForTransactionReceipt({ hash: tx1 });
        }
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
        toast({ title: 'Approve failed', description: msg });
        return;
      }

      // 2) Contribute
      try {
        const tx2 = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: 'contribute', args: [contribVal], chainId });
        toast({ title: 'Contribute submitted', description: String(tx2) });
        await publicClient?.waitForTransactionReceipt({ hash: tx2 });
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
        toast({ title: 'Contribute failed', description: msg });
        return;
      }

      // 3) Distribute (owner-only)
      try {
        const recips = recipientsCsv.split(',').map(s => s.trim()).filter(Boolean) as `0x${string}`[];
        const weights = weightsCsv.split(',').map(s => s.trim()).filter(Boolean).map(s => BigInt(s));
        if (recips.length === 0) return toast({ title: 'Add recipients' });
        if (recips.length !== weights.length) return toast({ title: 'Counts mismatch', description: 'Recipients and weights must align' });
        const tx3 = await writeContractAsync({ abi: sponsorPoolAbi, address: pool, functionName: 'distribute', args: [recips, weights, totalVal], chainId });
        toast({ title: 'Distribute submitted', description: String(tx3) });
        await publicClient?.waitForTransactionReceipt({ hash: tx3 });
        toast({ title: 'One-click payment complete' });
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
        toast({ title: 'Distribute failed', description: msg });
        return;
      }
    } finally {
      setPaying(false);
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

  const deployFromBackend = async () => {
    if (!chainId) return toast({ title: 'Connect to a network' });
    if (!isHexAddress(deployToken)) return toast({ title: 'Enter a valid token address' });
    const ownerToSet = isHexAddress(deployOwner) ? deployOwner : undefined;
    try {
      setDeploying(true);
      const resp = await fetch('/api/pools/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chainId, token: deployToken, newOwner: ownerToSet }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Deploy failed');
      const poolAddr = data.pool as string;
      toast({ title: 'Deployed SponsorPool', description: poolAddr });
      setPoolInput(poolAddr);
      setTokenInput(deployToken);
      if (chainId) saveContracts(chainId, { SponsorPool: poolAddr as `0x${string}`, SponsorToken: deployToken as `0x${string}` });
    } catch (e) {
      toast({ title: 'Deploy failed', description: String((e as any)?.message || e) });
    } finally {
      setDeploying(false);
    }
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
              {typeof chainId === 'number' && <Badge variant="outline">Chain {chainId}</Badge>}
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
              {poolCheckMsg && (
                <div className="text-xs text-amber-600 pt-1">{poolCheckMsg}</div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{owner ? String(owner) : <Skeleton className="h-4 w-40 inline-block align-middle" />}</span>
                {owner && <Button size="icon" variant="outline" onClick={() => copy(String(owner))}>⧉</Button>}
              </div>
              {isContract === false && (
                <div className="text-xs text-amber-600 pt-1">This pool address doesn’t implement owner(). Check the address/network.</div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Token</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{tokenAddress ? String(tokenAddress) : <Skeleton className="h-4 w-56 inline-block align-middle" />}</span>
                {tokenAddress && <Button size="icon" variant="outline" onClick={() => copy(String(tokenAddress))}>⧉</Button>}
              </div>
              {isContract === false && (
                <div className="text-xs text-amber-600 pt-1">Invalid pool address for this network.</div>
              )}
              {isContract && tokenLooksUnset && (
                <div className="text-xs text-amber-600 pt-1">token() appears unset. Ensure the pool was deployed with a token in its constructor.</div>
              )}
              {!tokenAddress && backendTokenHint && (
                <div className="text-xs text-muted-foreground pt-1">Backend token hint: {backendTokenHint}</div>
              )}
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
                {!tokenAddress && (
                  <div className="text-xs text-muted-foreground pt-1">
                    Pool token not configured yet. {isContract === false ? 'The address is not a contract; update the pool address for this chain.' : 'Did you deploy SponsorPool with a token constructor param?'}
                  </div>
                )}
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
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={distribute} className="w-full">Distribute</Button>
                <Button variant="secondary" onClick={oneClickPay} disabled={paying || !isOwner} className="w-full">
                  {paying ? 'Paying...' : 'One-click Pay (approve+contribute+distribute)'}
                </Button>
              </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Override pool address (advanced)</CardTitle>
              <CardDescription>Per-network override with Save & Refresh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Pool address</Label>
                <div className="flex gap-2">
                  <Input value={poolInput} onChange={(e) => setPoolInput(e.target.value.trim())} placeholder={defaultPoolAddress} />
                  <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(poolInput); toast({ title: 'Copied' }); } catch {} }}>Copy</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { try { const t = await navigator.clipboard.readText(); setPoolInput(t.trim()); } catch { toast({ title: 'Paste failed' }); } }}>Paste</Button>
                </div>
                {!isHexAddress(poolInput) && <div className="text-xs text-red-600 pt-1">Invalid address. Must be 0x-prefixed 40 hex chars.</div>}
              </div>
              <div>
                <Label>Token address (override)</Label>
                <div className="flex gap-2">
                  <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value.trim())} placeholder={defaultTokenAddress} />
                  <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(tokenInput); toast({ title: 'Copied' }); } catch {} }}>Copy</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { try { const t = await navigator.clipboard.readText(); setTokenInput(t.trim()); } catch { toast({ title: 'Paste failed' }); } }}>Paste</Button>
                </div>
                {!!tokenInput && !isHexAddress(tokenInput) && <div className="text-xs text-red-600 pt-1">Invalid token address.</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { if (chainId) saveContracts(chainId, { SponsorPool: poolInput as `0x${string}`, SponsorToken: tokenInput as `0x${string}` }); }}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setPoolInput(defaultPoolAddress); setTokenInput(defaultTokenAddress); if (chainId) saveContracts(chainId, { SponsorPool: defaultPoolAddress, SponsorToken: defaultTokenAddress }); }}>Use default</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deploy SponsorPool (backend)</CardTitle>
              <CardDescription>One-click deploy with token, then save config</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Token address (ERC-20)</Label>
                <Input value={deployToken} onChange={(e) => setDeployToken(e.target.value.trim())} placeholder={tokenForUi || '0x...'} />
                {!!deployToken && !isHexAddress(deployToken) && <div className="text-xs text-red-600 pt-1">Invalid token address.</div>}
              </div>
              <div>
                <Label>Transfer ownership to</Label>
                <Input value={deployOwner} onChange={(e) => setDeployOwner(e.target.value.trim())} placeholder={address || '0x...'} />
                {!!deployOwner && !isHexAddress(deployOwner) && <div className="text-xs text-red-600 pt-1">Invalid owner address.</div>}
              </div>
              <div className="flex gap-2">
                <Button onClick={deployFromBackend} disabled={deploying} className="w-full">{deploying ? 'Deploying...' : 'Deploy & Save'}</Button>
              </div>
              <div className="text-xs text-muted-foreground">Backend must be configured with DEPLOYER_PRIVATE_KEY and RPC URL for this network.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SponsorPoolPage;
