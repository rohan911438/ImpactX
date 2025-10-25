import { useAccount, useChainId, useReadContract, useWriteContract, useSwitchChain, useConnect, usePublicClient } from "wagmi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { CONTRACTS } from "@/contracts/addresses";
import { CELO_SEPOLIA_ID } from "@/lib/wallet";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
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
  const { connectors, connectAsync } = useConnect();
  const { toast } = useToast();
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("ImpactX PoI");
  const [description, setDescription] = useState("Proof-of-Impact NFT minted via ImpactX");
  const [image, setImage] = useState("/uploads/sample.jpg");
  const publicClient = usePublicClient({ chainId: CELO_SEPOLIA_ID });

  const contractAddress = CONTRACTS.celoSepolia.ImpactNFT as `0x${string}`;
  const registryAddress = CONTRACTS.celoSepolia.ImpactRegistry as `0x${string}`;

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

  // Manual refresh/override states
  const [ownerOverride, setOwnerOverride] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [symbolOverride, setSymbolOverride] = useState<string | null>(null);
  const [meIsMinterOverride, setMeIsMinterOverride] = useState<boolean | null>(null);
  const [registryIsMinterOverride, setRegistryIsMinterOverride] = useState<boolean | null>(null);

  const { data: isMinter } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "isMinter",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address) },
  });

  const { data: registryIsMinter } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "isMinter",
    args: [registryAddress],
    chainId: CELO_SEPOLIA_ID,
  });

  const refreshOnchain = async () => {
    try {
      // Read owner, name, symbol, and minter flags directly via viem client
      const [o, nm, sy, meMinter, regMinter] = await Promise.all([
        publicClient!.readContract({ abi: impactNftAbi, address: contractAddress, functionName: 'owner' }) as Promise<string>,
        publicClient!.readContract({ abi: impactNftAbi, address: contractAddress, functionName: 'name' }) as Promise<string>,
        publicClient!.readContract({ abi: impactNftAbi, address: contractAddress, functionName: 'symbol' }) as Promise<string>,
        address ? publicClient!.readContract({ abi: impactNftAbi, address: contractAddress, functionName: 'isMinter', args: [address] }) as Promise<boolean> : Promise.resolve(false),
        publicClient!.readContract({ abi: impactNftAbi, address: contractAddress, functionName: 'isMinter', args: [registryAddress] }) as Promise<boolean>,
      ]);
  setOwnerOverride(o);
  setNameOverride(nm);
  setSymbolOverride(sy);
  setMeIsMinterOverride(!!meMinter);
  setRegistryIsMinterOverride(!!regMinter);
      toast({ title: 'On-chain state refreshed', description: 'Owner, name, symbol, and minter flags updated.' });
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Refresh failed', description: msg });
    }
  };

  // Connect helper for UI banner
  const connectWallet = async () => {
    try {
      const mm = connectors.find((c) => c.id === "io.metamask") || connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
      if (!mm) throw new Error("No wallet connector available");
      await connectAsync({ connector: mm, chainId: CELO_SEPOLIA_ID });
      if (chainId !== CELO_SEPOLIA_ID) await switchChain({ chainId: CELO_SEPOLIA_ID });
      await refreshOnchain();
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Connect failed', description: msg });
    }
  };

  // Auto refresh on mount and when address/chain changes
  useEffect(() => {
    (async () => {
      try { if (publicClient) await refreshOnchain(); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    (async () => {
      try { if (publicClient) await refreshOnchain(); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId]);

  const { data: myBal } = useReadContract({
    abi: impactNftAbi,
    address: contractAddress,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CELO_SEPOLIA_ID,
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync } = useWriteContract();

  // Ensure wallet is connected and on Celo Sepolia before writing
  const ensureConnectedAndOnSepolia = async () => {
    try {
      if (!address) {
        const mm = connectors.find((c) => c.id === "io.metamask") || connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
        if (!mm) throw new Error("No wallet connector available");
        await connectAsync({ connector: mm, chainId: CELO_SEPOLIA_ID });
      }
      if (chainId !== CELO_SEPOLIA_ID) {
        await switchChain({ chainId: CELO_SEPOLIA_ID });
      }
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Wallet action needed', description: msg });
      throw e;
    }
  };

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
    // Auto-connect and switch if needed
    await ensureConnectedAndOnSepolia();
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

  const authorizeSelf = async (allowed: boolean) => {
    await ensureConnectedAndOnSepolia();
    try {
      const tx = await writeContractAsync({
        abi: impactNftAbi,
        address: contractAddress,
        functionName: 'setMinter',
        args: [address, allowed],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: allowed ? 'Authorized as minter' : 'Revoked minter', description: String(tx) });
      // Refresh state after tx
      await refreshOnchain();
    } catch (e: unknown) {
      const raw = (typeof e === 'string') ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      const msg = typeof raw === 'string' && raw.toLowerCase().includes('caller is not the owner')
        ? 'Only the contract owner can update minters.'
        : raw;
      toast({ title: 'Authorization failed', description: msg });
    }
  };

  const authorizeRegistry = async (allowed: boolean) => {
    await ensureConnectedAndOnSepolia();
    try {
      const tx = await writeContractAsync({
        abi: impactNftAbi,
        address: contractAddress,
        functionName: 'setMinter',
        args: [registryAddress, allowed],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: allowed ? 'Registry authorized' : 'Registry revoked', description: String(tx) });
      await refreshOnchain();
    } catch (e: unknown) {
      const raw = (typeof e === 'string') ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      const msg = typeof raw === 'string' && raw.toLowerCase().includes('caller is not the owner')
        ? 'Only the contract owner can update minters.'
        : raw;
      toast({ title: 'Authorization failed', description: msg });
    }
  };

  const authorizeMeAndRegistry = async () => {
    await ensureConnectedAndOnSepolia();
    if (String(owner || '').toLowerCase() !== String(address).toLowerCase()) {
      return toast({ title: "Not contract owner", description: "Only the owner can update minters." });
    }
    try {
      const tx1 = await writeContractAsync({
        abi: impactNftAbi,
        address: contractAddress,
        functionName: 'setMinter',
        args: [address!, true],
        chainId: CELO_SEPOLIA_ID,
      });
      const tx2 = await writeContractAsync({
        abi: impactNftAbi,
        address: contractAddress,
        functionName: 'setMinter',
        args: [registryAddress, true],
        chainId: CELO_SEPOLIA_ID,
      });
      toast({ title: 'Authorized (you + registry)', description: `Self: ${String(tx1)}\nRegistry: ${String(tx2)}` });
      await refreshOnchain();
    } catch (e: unknown) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Authorization failed', description: msg });
    }
  };

  const role = (() => {
    const me = (address || '').toLowerCase();
    if (!me) return 'viewer';
    const own = (ownerOverride ?? String(owner ?? '')).toLowerCase();
    if (own && own === me) return 'owner';
    if (meIsMinterOverride === true || Boolean(isMinter)) return 'minter';
    return 'viewer';
  })();

  const short = (a?: string) => (a ? `${a.slice(0,6)}...${a.slice(-4)}` : '—');
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Address copied to clipboard' });
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Unable to write to clipboard' });
    }
  };
  const fillSample = () => {
    setName('ImpactX PoI');
    setDescription('Proof-of-Impact NFT minted via ImpactX');
    setImage(`https://picsum.photos/seed/impact-${Math.floor(Math.random()*1000)}/640/360`);
  };
  const clearForm = () => { setName(''); setDescription(''); setImage(''); };

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="glass-effect">
          {(chainId !== CELO_SEPOLIA_ID || !address) && (
            <div className="p-3 mx-4 mt-4 mb-0 rounded-md border border-amber-400 bg-amber-50 text-amber-800 flex items-center justify-between gap-2">
              <div className="text-xs">
                {!address ? 'Connect your wallet' : 'Wrong network. Switch to Celo Sepolia.'}
              </div>
              <div className="flex gap-2">
                {!address && <Button size="sm" variant="secondary" onClick={connectWallet}>Connect</Button>}
                {address && chainId !== CELO_SEPOLIA_ID && (
                  <Button size="sm" variant="outline" onClick={() => switchChain({ chainId: CELO_SEPOLIA_ID })}>Switch</Button>
                )}
              </div>
            </div>
          )}
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">ImpactNFT</CardTitle>
              <CardDescription>
                {nameOverride ?? (nftName ? String(nftName) : <Skeleton className="h-4 w-40 inline-block align-middle" />)} ({symbolOverride ?? (nftSymbol ? String(nftSymbol) : <Skeleton className="h-4 w-16 inline-block align-middle" />)})
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
                <Button onClick={mint} disabled={minting} className="w-full">
                  {minting ? "Minting..." : "Mint PoI NFT"}
                </Button>
                {!address && <div className="text-xs text-muted-foreground">Connect your wallet to mint.</div>}
                {address && chainId !== CELO_SEPOLIA_ID && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Wrong network. Switch to Celo Sepolia.</span>
                    <Button size="sm" variant="outline" onClick={() => switchChain({ chainId: CELO_SEPOLIA_ID })}>Switch</Button>
                  </div>
                )}
                {address && chainId === CELO_SEPOLIA_ID && !canMint && (
                  <div className="text-xs text-muted-foreground">
                    Mint will revert unless you are the contract owner or an authorized minter.
                  </div>
                )}
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
                <span>{ownerOverride ?? (owner ? String(owner) : '—')}</span>
                {(ownerOverride || owner) && <Button size="icon" variant="outline" onClick={() => copy(String(ownerOverride ?? owner))}>⧉</Button>}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">You authorized?</div>
              <div className="text-sm">{(meIsMinterOverride ?? isMinter) ? 'Yes' : 'No'}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Registry</div>
              <div className="text-sm font-mono break-all flex items-center justify-between gap-2">
                <span>{registryAddress}</span>
                <Button size="icon" variant="outline" onClick={() => copy(registryAddress)}>⧉</Button>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Registry authorized?</div>
              <div className="text-sm">{(registryIsMinterOverride ?? registryIsMinter) ? 'Yes' : 'No'}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="text-sm capitalize">{role}</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Actions</div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={refreshOnchain}>Refresh on-chain</Button>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-border space-y-2">
              <div className="text-xs text-muted-foreground">Owner actions</div>
              {owner && address && String(owner).toLowerCase() !== String(address).toLowerCase() && (
                <div className="text-xs text-amber-600 dark:text-amber-500">
                  Connected account isn't the contract owner. Connect owner wallet {short(String(owner))} to authorize.
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => authorizeSelf(true)}>Authorize me as minter</Button>
                <Button size="sm" variant="outline" onClick={() => authorizeSelf(false)}>Revoke me</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => authorizeRegistry(true)}>Authorize Registry</Button>
                <Button size="sm" variant="outline" onClick={() => authorizeRegistry(false)}>Revoke Registry</Button>
                <Button size="sm" variant="ghost" onClick={authorizeMeAndRegistry}>Authorize both</Button>
              </div>
              {role !== 'owner' && (
                <div className="text-xs text-muted-foreground">Only the contract owner can execute these. Clicking will prompt and then fail with a clear message if you are not the owner.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NFTPage;
