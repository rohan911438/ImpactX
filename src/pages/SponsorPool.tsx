import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { sponsorPoolAbi } from "@/contracts/sponsorPool.abi";
import { erc20Abi } from "@/contracts/erc20.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">SponsorPool</h1>
          <p className="text-sm text-muted-foreground">Pool: {pool}</p>
          <p className="text-sm text-muted-foreground">Owner: {String(owner)}</p>
          <p className="text-sm text-muted-foreground">Token: {String(tokenAddress)}</p>
          <p className="text-sm text-muted-foreground">Total Contributions: {decimals != null ? formatUnits((totalContrib as bigint) || 0n, Number(decimals)) : String(totalContrib || 0)} {String(symbol || "").toString()}</p>
          <p className="text-sm text-muted-foreground">Your Contributions: {decimals != null ? formatUnits((myContrib as bigint) || 0n, Number(decimals)) : String(myContrib || 0)} {String(symbol || "").toString()}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-semibold">Contribute</h2>
            <div>
              <label className="block text-sm mb-1">Amount ({String(symbol || "")})</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10.5" />
            </div>
            {needApprove ? (
              <Button onClick={doApprove}>Approve</Button>
            ) : (
              <Button onClick={contribute}>Contribute</Button>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Owner actions</h2>
            <div>
              <label className="block text-sm mb-1">Recipients (comma-separated)</label>
              <Input value={recipientsCsv} onChange={(e) => setRecipientsCsv(e.target.value)} placeholder="0xabc...,0xdef..." />
            </div>
            <div>
              <label className="block text-sm mb-1">Weights (comma-separated, ints)</label>
              <Input value={weightsCsv} onChange={(e) => setWeightsCsv(e.target.value)} placeholder="70,30" />
            </div>
            <div>
              <label className="block text-sm mb-1">Total Amount ({String(symbol || "")})</label>
              <Input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="100" />
            </div>
            <Button onClick={distribute}>Distribute</Button>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <div>
                <label className="block text-sm mb-1">Withdraw To</label>
                <Input value={withdrawTo} onChange={(e) => setWithdrawTo(e.target.value)} placeholder="0x..." />
              </div>
              <div>
                <label className="block text-sm mb-1">Amount ({String(symbol || "")})</label>
                <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="5" />
              </div>
            </div>
            <Button variant="outline" onClick={withdraw}>Withdraw</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorPoolPage;
