import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { impactRegistryAbi } from "@/contracts/impactRegistry.abi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    <div className="min-h-screen bg-background md:pl-64">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="glass-effect">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">ImpactRegistry</CardTitle>
              <CardDescription>On-chain registry for verified impacts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Celo Sepolia</Badge>
              <Badge variant={isOwner ? 'secondary' : 'outline'}>{isOwner ? 'Owner' : 'Viewer'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Registry</div>
              <div className="text-sm font-mono break-all">{registry}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all">{String(owner)}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">NFT</div>
              <div className="text-sm font-mono break-all">{String(currentNft)}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Next ID</div>
              <div className="text-xl font-bold">{String(nextId ?? 0)}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit Impact</CardTitle>
              <CardDescription>Create metadata and submit on-chain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Action Type</Label>
                <Input value={actionType} onChange={(e) => setActionType(e.target.value)} />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/uploads/... or https://" />
              </div>
              <Button onClick={submit} disabled={submitting} className="w-full">{submitting ? "Submitting..." : "Submit Impact"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner actions</CardTitle>
              <CardDescription>Manage NFT contract and verifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={setNftContract}>Set NFT contract → {nft}</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Verify Impact ID</Label>
                  <Input type="number" value={verifyId} onChange={(e) => setVerifyId(Number(e.target.value))} />
                </div>
                <div>
                  <Label>AI Score (0-100)</Label>
                  <Input type="number" value={aiScore} min={0} max={100} onChange={(e) => setAiScore(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Reward (wei-like)</Label>
                  <Input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label className="text-sm">Mint NFT?</Label>
                  <Switch checked={mintNFT} onCheckedChange={setMintNFT} />
                </div>
              </div>
              <Button onClick={verify} className="w-full">Verify Impact</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistryPage;
