import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { impactRegistryAbi } from "@/contracts/impactRegistry.abi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const RegistryPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState("Tree Planting");
  const [name, setName] = useState("ImpactX PoI");
  const [description, setDescription] = useState("Verified impact via ImpactRegistry");
  const [image, setImage] = useState("/uploads/sample.jpg");
  const [verifyId, setVerifyId] = useState(0);
  const [aiScore, setAiScore] = useState(95);
  const [reward, setReward] = useState(10);
  const [mintNFT, setMintNFT] = useState(true);

  const registry = CONTRACTS.celoSepolia.ImpactRegistry as `0x${string}`;
  const nft = CONTRACTS.celoSepolia.ImpactNFT as `0x${string}`;

  const { data: nextId } = useReadContract({
    abi: impactRegistryAbi,
    address: registry,
    functionName: "nextId",
    chainId: CELO_SEPOLIA_ID,
  });

  const { data: owner } = useReadContract({
    abi: impactRegistryAbi,
    address: registry,
    functionName: "owner",
    chainId: CELO_SEPOLIA_ID,
  });

  const { data: currentNft } = useReadContract({
    abi: impactRegistryAbi,
    address: registry,
    functionName: "nft",
    chainId: CELO_SEPOLIA_ID,
  });

  const { writeContractAsync } = useWriteContract();

  const isOwner = Boolean(address) && String(owner).toLowerCase() === String(address).toLowerCase();

  const createMetadata = async () => {
    const res = await fetch("/api/nft/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, image }),
    });
    if (!res.ok) throw new Error("Failed to create metadata");
    const { id } = await res.json();
    return `${window.location.origin}/api/nft/metadata/${id}`;
  };

  const submit = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      setSubmitting(true);
      const uri = await createMetadata();
      const hash = await writeContractAsync({
        abi: impactRegistryAbi,
        address: registry,
        functionName: "submitImpact",
        args: [actionType, uri],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: "Submitted", description: String(hash) });
    } catch (e: unknown) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') ? (e as any).message : String(e);
      toast({ title: "Submit failed", description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const setNftContract = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const hash = await writeContractAsync({
        abi: impactRegistryAbi,
        address: registry,
        functionName: "setNFTContract",
        args: [nft],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: "NFT contract set", description: String(hash) });
    } catch (e) {
      toast({ title: "Failed", description: String(e) });
    }
  };

  const verify = async () => {
    if (!isOwner) return toast({ title: "Owner only" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    try {
      const hash = await writeContractAsync({
        abi: impactRegistryAbi,
        address: registry,
        functionName: "verifyImpact",
        args: [BigInt(verifyId), BigInt(aiScore), BigInt(reward), mintNFT],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: "Verified", description: String(hash) });
    } catch (e) {
      toast({ title: "Failed", description: String(e) });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">ImpactRegistry</h1>
          <p className="text-sm text-muted-foreground">Registry: {registry}</p>
          <p className="text-sm text-muted-foreground">Owner: {String(owner)}</p>
          <p className="text-sm text-muted-foreground">NFT: {String(currentNft)}</p>
          <p className="text-sm text-muted-foreground">Next ID: {String(nextId ?? 0)}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-semibold">Submit Impact</h2>
            <div>
              <label className="block text-sm mb-1">Action Type</label>
              <Input value={actionType} onChange={(e) => setActionType(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Image URL</label>
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/uploads/... or https://" />
            </div>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Impact (on-chain)"}</Button>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Owner actions</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={setNftContract}>Set NFT contract → {nft}</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Verify Impact ID</label>
                <Input type="number" value={verifyId} onChange={(e) => setVerifyId(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm mb-1">AI Score (0-100)</label>
                <Input type="number" value={aiScore} min={0} max={100} onChange={(e) => setAiScore(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Reward (wei-like)</label>
                <Input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Mint NFT?</label>
                <Input type="checkbox" checked={mintNFT} onChange={(e) => setMintNFT(e.target.checked)} />
              </div>
            </div>
            <Button onClick={verify}>Verify Impact</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistryPage;
