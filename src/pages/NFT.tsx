import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const NFTPage = () => {
  const { address } = useAccount();
  const chainId = useChainId();
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

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">ImpactNFT</h1>
        <p className="text-muted-foreground mb-6">{String(nftName)} ({String(nftSymbol)})</p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
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
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/uploads/.. or https://" />
            </div>
            <div className="text-sm text-muted-foreground">Your balance: {String(myBal || 0)}</div>
            <Button onClick={mint} disabled={!canMint || minting}>{minting ? "Minting..." : "Mint PoI NFT"}</Button>
            {!canMint && <div className="text-xs text-muted-foreground">Minting requires contract owner or authorized minter.</div>}
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">About</h2>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Network: Celo Sepolia</li>
              <li>Contract: {contractAddress}</li>
              <li>Owner: {String(owner)}</li>
              <li>Mint requires authorization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTPage;
