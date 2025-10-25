import { useAccount, useChainId, useReadContract, useWriteContract, useConnect, usePublicClient } from "wagmi";
import { impactNftAbi } from "@/contracts/impactNft.abi";
import { resolveContracts, saveContracts } from "@/contracts/resolve";
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
  const { connectors, connectAsync } = useConnect();
  const { toast } = useToast();
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("ImpactX PoI");
  const [description, setDescription] = useState("Proof-of-Impact NFT minted via ImpactX");
  const [image, setImage] = useState("/uploads/sample.jpg");
  const publicClient = usePublicClient();
  

  const defaults = resolveContracts(chainId);
  const defaultNftAddress = (defaults.ImpactNFT || "") as `0x${string}`;
  const defaultRegistryAddress = (defaults.ImpactRegistry || "") as `0x${string}`;

  // Allow overriding addresses (useful if you authorized a different deployment)
  const [nftAddressInput, setNftAddressInput] = useState<string>(() => {
    const c = resolveContracts(chainId);
    return c.ImpactNFT || defaultNftAddress || "";
  });
  const [registryAddressInput, setRegistryAddressInput] = useState<string>(() => {
    const c = resolveContracts(chainId);
    return c.ImpactRegistry || defaultRegistryAddress || "";
  });

  const isHexAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v || "");
  const nftAddress = (isHexAddress(nftAddressInput) ? nftAddressInput : defaultNftAddress) as `0x${string}`;
  const registryAddress = (isHexAddress(registryAddressInput) ? registryAddressInput : defaultRegistryAddress) as `0x${string}`;

  const { data: nftName } = useReadContract({
    abi: impactNftAbi,
    address: nftAddress,
    functionName: "name",
    chainId,
  });

  const { data: nftSymbol } = useReadContract({
    abi: impactNftAbi,
    address: nftAddress,
    functionName: "symbol",
    chainId,
  });

  const { data: owner } = useReadContract({
    abi: impactNftAbi,
    address: nftAddress,
    functionName: "owner",
    chainId,
  });

  // Manual refresh/override states
  const [ownerOverride, setOwnerOverride] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [symbolOverride, setSymbolOverride] = useState<string | null>(null);
  const [meIsMinterOverride, setMeIsMinterOverride] = useState<boolean | null>(null);
  const [registryIsMinterOverride, setRegistryIsMinterOverride] = useState<boolean | null>(null);

  const { data: isMinter } = useReadContract({
    abi: impactNftAbi,
    address: nftAddress,
    functionName: "isMinter",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId,
    query: { enabled: Boolean(address) },
  });

  const { data: registryIsMinter } = useReadContract({
    abi: impactNftAbi,
    address: nftAddress,
    functionName: "isMinter",
    args: [registryAddress],
    chainId,
  });

  const refreshOnchain = async () => {
    try {
      // Read owner, name, symbol, and minter flags directly via viem client
      if (!publicClient) throw new Error('No RPC client. Connect a wallet or set a custom RPC.');
      const [o, nm, sy, meMinter, regMinter] = await Promise.all([
        publicClient.readContract({ abi: impactNftAbi, address: nftAddress, functionName: 'owner' }) as Promise<string>,
        publicClient.readContract({ abi: impactNftAbi, address: nftAddress, functionName: 'name' }) as Promise<string>,
        publicClient.readContract({ abi: impactNftAbi, address: nftAddress, functionName: 'symbol' }) as Promise<string>,
        address ? publicClient.readContract({ abi: impactNftAbi, address: nftAddress, functionName: 'isMinter', args: [address] }) as Promise<boolean> : Promise.resolve(false),
        publicClient.readContract({ abi: impactNftAbi, address: nftAddress, functionName: 'isMinter', args: [registryAddress] }) as Promise<boolean>,
      ]);
  setOwnerOverride(o);
  setNameOverride(nm);
  setSymbolOverride(sy);
  setMeIsMinterOverride(!!meMinter);
  setRegistryIsMinterOverride(!!regMinter);
      toast({ title: 'On-chain state refreshed', description: 'Owner, name, symbol, and minter flags updated.' });
    } catch (e) {
      const raw = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      const lower = String(raw).toLowerCase();
      const hint = lower.includes('http request failed') || lower.includes('httprequesterror')
        ? 'RPC unreachable. Check your internet, switch to Celo Sepolia, or set a custom RPC in settings. Then try again.'
        : undefined;
      toast({ title: 'Refresh failed', description: hint ? `${raw}\n${hint}` : raw });
    }
  };

  // Connect helper for UI banner
  const connectWallet = async () => {
    try {
      const mm = connectors.find((c) => c.id === "io.metamask") || connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
      if (!mm) throw new Error("No wallet connector available");
      await connectAsync({ connector: mm });
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
    address: nftAddress,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId,
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync } = useWriteContract();

  // Ensure wallet is connected before writing
  const ensureConnected = async () => {
    try {
      if (!address) {
        const mm = connectors.find((c) => c.id === "io.metamask") || connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
        if (!mm) throw new Error("No wallet connector available");
        await connectAsync({ connector: mm });
      }
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Wallet action needed', description: msg });
      throw e;
    }
  };

  const effectiveOwner = (ownerOverride ?? String(owner ?? '')).toLowerCase();
  const effectiveIsMinter = (meIsMinterOverride ?? Boolean(isMinter)) as boolean;
  const canMint = Boolean(address) && (effectiveOwner === String(address||'').toLowerCase() || effectiveIsMinter);

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
    // Auto-connect if needed (don’t block on reads; let chain enforce permissions)
    await ensureConnected();
    if (!canMint) {
      toast({ title: "May revert", description: "Not owner/minter. Attempting mint anyway to get exact error from chain." });
    }
    try {
      setMinting(true);
      const tokenUri = await createMetadata();
      const hash = await writeContractAsync({
        abi: impactNftAbi,
        address: nftAddress,
        functionName: "mintTo",
        args: [address, tokenUri],
        chainId,
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
    await ensureConnected();
    try {
      const tx = await writeContractAsync({
        abi: impactNftAbi,
        address: nftAddress,
        functionName: 'setMinter',
        args: [address, allowed],
        chainId,
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
    await ensureConnected();
    try {
      const tx = await writeContractAsync({
        abi: impactNftAbi,
        address: nftAddress,
        functionName: 'setMinter',
        args: [registryAddress, allowed],
        chainId,
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
    await ensureConnected();
    try {
      const tx1 = await writeContractAsync({
        abi: impactNftAbi,
        address: nftAddress,
        functionName: 'setMinter',
        args: [address!, true],
        chainId,
      });
      const tx2 = await writeContractAsync({
        abi: impactNftAbi,
        address: nftAddress,
        functionName: 'setMinter',
        args: [registryAddress, true],
        chainId,
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
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', description: 'Your browser blocked clipboard access.' });
    }
  };
  const pasteTo = async (setter: (v: string) => void) => {
    try {
      const txt = await navigator.clipboard.readText();
      setter(txt.trim());
    } catch {
      toast({ title: 'Paste failed', description: 'Grant clipboard permission and try again.' });
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
          {(!address) && (
            <div className="p-3 mx-4 mt-4 mb-0 rounded-md border border-amber-400 bg-amber-50 text-amber-800 flex items-center justify-between gap-2">
              <div className="text-xs">
                Connect your wallet
              </div>
              <div className="flex gap-2">
                {!address && <Button size="sm" variant="secondary" onClick={connectWallet}>Connect</Button>}
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
              {typeof chainId === 'number' && <Badge variant="outline">Chain {chainId}</Badge>}
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
                {address && !canMint && (
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
                    <div className="pt-2 text-xs text-muted-foreground break-words">{nftAddress}</div>
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
                <span>{nftAddress}</span>
                <Button size="icon" variant="outline" onClick={() => copy(nftAddress)}>⧉</Button>
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
              <div className="text-xs text-muted-foreground">Override addresses (advanced)</div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">NFT contract</div>
                  <div className="flex gap-2">
                    <Input value={nftAddressInput} onChange={(e) => setNftAddressInput(e.target.value.trim())} placeholder={defaultNftAddress} />
                    <Button size="sm" variant="outline" onClick={() => copyText(nftAddressInput)}>Copy</Button>
                    <Button size="sm" variant="ghost" onClick={() => pasteTo(setNftAddressInput)}>Paste</Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Registry</div>
                  <div className="flex gap-2">
                    <Input value={registryAddressInput} onChange={(e) => setRegistryAddressInput(e.target.value.trim())} placeholder={defaultRegistryAddress} />
                    <Button size="sm" variant="outline" onClick={() => copyText(registryAddressInput)}>Copy</Button>
                    <Button size="sm" variant="ghost" onClick={() => pasteTo(setRegistryAddressInput)}>Paste</Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { if (chainId) saveContracts(chainId, { ImpactNFT: nftAddressInput as `0x${string}`, ImpactRegistry: registryAddressInput as `0x${string}` }); refreshOnchain(); }}>Save & refresh</Button>
                <Button size="sm" variant="outline" onClick={() => { setNftAddressInput(defaultNftAddress); setRegistryAddressInput(defaultRegistryAddress); if (chainId) saveContracts(chainId, { ImpactNFT: defaultNftAddress, ImpactRegistry: defaultRegistryAddress }); refreshOnchain(); }}>Use defaults</Button>
              </div>
              {!isHexAddress(nftAddressInput) && <div className="text-xs text-red-600">Invalid NFT address. Must be 0x-prefixed 40 hex characters.</div>}
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
              {/* Transfer ownership (owner only) */}
              <TransferOwnershipSection nftAddress={nftAddress} chainId={chainId} onDone={refreshOnchain} />
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

// Small inline component to handle transferOwnership
const TransferOwnershipSection = ({ nftAddress, chainId, onDone }: { nftAddress: `0x${string}`; chainId?: number; onDone?: () => Promise<void> | void }) => {
  const [to, setTo] = useState("");
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const isHexAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v || "");

  const doTransfer = async () => {
    if (!isHexAddress(to)) {
      toast({ title: 'Invalid address', description: 'Enter a valid 0x address' });
      return;
    }
    try {
      const tx = await writeContractAsync({ abi: impactNftAbi, address: nftAddress, functionName: 'transferOwnership', args: [to as `0x${string}`], chainId });
      toast({ title: 'Ownership transfer submitted', description: String(tx) });
      await onDone?.();
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e && typeof e === 'object' ? ((e as any).shortMessage || (e as any).message || JSON.stringify(e)) : String(e));
      toast({ title: 'Transfer failed', description: msg });
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="text-xs text-muted-foreground">Transfer ownership</div>
      <div className="flex gap-2">
        <Input placeholder="0xNewOwner" value={to} onChange={(e) => setTo(e.target.value.trim())} />
        <Button size="sm" variant="outline" onClick={doTransfer} disabled={!address}>Transfer</Button>
      </div>
    </div>
  );
};

export default NFTPage;
