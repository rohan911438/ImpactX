import { useAccount, useChainId, useReadContract, useWriteContract, useSwitchChain } from "wagmi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const NFTPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("ImpactX PoI");
  const [description, setDescription] = useState("Proof-of-Impact NFT minted via ImpactX");
  const [image, setImage] = useState("/uploads/sample.jpg");

  const contractAddress = CONTRACTS.celoSepolia.ImpactNFT as `0x${string}`;

  const { data: nftName } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "name",
    chainId: CELO_SEPOLIA_ID,
  });

  const { data: nftSymbol } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "symbol",
    chainId: CELO_SEPOLIA_ID,
  });

  const { data: owner } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "owner",
    chainId: CELO_SEPOLIA_ID,
  });

  const { data: isMinter } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "isMinter",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: myBal } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync } = useWriteContract();

  const canMint = Boolean(address) && (String(owner).toLowerCase() === String(address).toLowerCase() || Boolean(isMinter));

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

  const mint = async () => {
    if (!address) return toast({ title: "Connect wallet" });
    if (chainId !== CELO_SEPOLIA_ID) return toast({ title: "Switch to Celo Sepolia" });
    if (!canMint) return toast({ title: "Not authorized to mint (owner or minter only)" });
    try {
      setMinting(true);
      const tokenUri = await createMetadata();
      const hash = await writeContractAsync({
        abi: impactNftAbi,
        address: contractAddress,
        functionName: "mintTo",
        args: [address, tokenUri],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: "Mint submitted", description: String(hash) });
    } catch (e: unknown) {
      if (typeof e === 'string') {
        toast({ title: "Mint failed", description: e });
      } else if (e && typeof e === 'object') {
        const err = e as { shortMessage?: unknown; message?: unknown };
        const msg = (typeof err.shortMessage === 'string')
          ? err.shortMessage
          : (typeof err.message === 'string')
            ? err.message
            : JSON.stringify(err);
        toast({ title: "Mint failed", description: msg });
      } else {
        toast({ title: "Mint failed", description: String(e) });
      }
    } finally {
      setMinting(false);
    }
  };

  const role = (() => {
    const me = (address || '').toLowerCase();
    if (!me) return 'viewer';
    if (String(owner || '').toLowerCase() === me) return 'owner';
    if (isMinter) return 'minter';
    return 'viewer';
  })();

  const short = (a?: string) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '—');
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: 'Copied', description: 'Address copied to clipboard' }); } catch {}
  };
  const fillSample = () => {
    setName('ImpactX PoI');
    setDescription('Proof-of-Impact NFT minted via ImpactX');
    setImage(`https://picsum.photos/seed/impact-${Math.floor(Math.random()*1000)}/640/360`);
  };
  const clearForm = () => { setName(''); setDescription(''); setImage(''); };

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="glass-effect">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">ImpactNFT</CardTitle>
              <CardDescription>
                {nftName ? String(nftName) : <Skeleton className="h-4 w-40 inline-block align-middle" />} ({nftSymbol ? String(nftSymbol) : <Skeleton className="h-4 w-16 inline-block align-middle" />})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Celo Sepolia</Badge>
              <Badge variant={role !== 'viewer' ? 'secondary' : 'outline'} className="capitalize">{role}</Badge>
              <Badge variant="outline" className="font-mono">{short(address)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <Card className="order-2 md:order-1">
              <CardHeader>
                <CardTitle>Mint Proof-of-Impact</CardTitle>
                <CardDescription>Owner or authorized minter can mint an NFT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Your NFT balance: {myBal != null ? String(myBal) : '—'}</span>
                  <Button size="sm" variant="outline" onClick={fillSample}>Sample</Button>
                  <Button size="sm" variant="ghost" onClick={clearForm}>Clear</Button>
                </div>
                <Button onClick={mint} disabled={!canMint || minting} className="w-full">
                  {minting ? "Minting..." : "Mint PoI NFT"}
                </Button>
                {!address && <div className="text-xs text-muted-foreground">Connect your wallet to mint.</div>}
                {address && chainId !== CELO_SEPOLIA_ID && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Wrong network. Switch to Celo Sepolia.</span>
                    <Button size="sm" variant="outline" onClick={() => switchChain({ chainId: CELO_SEPOLIA_ID })}>Switch</Button>
                  </div>
                )}
                {address && chainId === CELO_SEPOLIA_ID && !canMint && <div className="text-xs text-muted-foreground">Minting requires contract owner or authorized minter.</div>}
              </CardContent>
            </Card>
            <Card className="order-1 md:order-2 overflow-hidden">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Live preview of your metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  {image ? (
                    <img src={image} alt={name || 'preview'} className="w-full h-60 object-cover" />
                  ) : (
                    <div className="w-full h-60 grid place-items-center text-sm text-muted-foreground">No image</div>
                  )}
                  <div className="p-4 space-y-1">
                    <div className="text-lg font-semibold">{name}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                    <div className="pt-2 text-xs text-muted-foreground break-words">{contractAddress}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract info</CardTitle>
            <CardDescription>On-chain details</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Contract</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{contractAddress}</span>
                <Button size="icon" variant="outline" onClick={() => copy(contractAddress)}>⧉</Button>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{owner ? String(owner) : '—'}</span>
                {owner && <Button size="icon" variant="outline" onClick={() => copy(String(owner))}>⧉</Button>}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="text-sm capitalize">{role}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NFTPage;
