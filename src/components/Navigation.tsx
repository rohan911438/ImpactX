import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Wallet, LogOut, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount, useDisconnect, useChainId, useSwitchChain, useBalance, useReadContract } from "wagmi";
import { CELO_ALFAJORES_ID, CELO_MAINNET_ID } from "@/lib/wallet";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  isConnected?: boolean;
  walletAddress?: string;
  balance?: string;
  onDisconnect?: () => void;
}

export const Navigation = ({ 
  isConnected = false, 
  walletAddress = "", 
  balance = "0",
  onDisconnect 
}: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const wagmiAccount = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();

  // Live balances
  const { data: nativeBal } = useBalance({ address: wagmiAccount.address, query: { enabled: wagmiAccount.isConnected } });
  const CUSD_ADDRESSES: Record<number, `0x${string}`> = {
    [CELO_MAINNET_ID]: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    [CELO_ALFAJORES_ID]: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  } as const;
  const erc20Abi = [
    { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [{ "name": "owner", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }] },
    { "type": "function", "name": "decimals", "stateMutability": "view", "inputs": [], "outputs": [{ "name": "", "type": "uint8" }] },
  ] as const;
  const cusdAddress = chainId && CUSD_ADDRESSES[chainId as number];
  const { data: cusdRaw } = useReadContract({
    address: cusdAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: wagmiAccount.address ? [wagmiAccount.address] : undefined,
    query: { enabled: Boolean(wagmiAccount.isConnected && cusdAddress) },
  });
  const { data: cusdDecimals } = useReadContract({
    address: cusdAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: Boolean(wagmiAccount.isConnected && cusdAddress) },
  });
  const cusdFormatted = (() => {
    try {
      if (!cusdRaw || cusdDecimals == null) return null;
      const d = Number(cusdDecimals as number);
      const raw = BigInt(cusdRaw as unknown as string);
      const value = Number(raw) / 10 ** d;
      return value.toFixed(2);
    } catch {
      return null;
    }
  })();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    if (onDisconnect) {
      onDisconnect();
    }
    if (wagmiAccount.isConnected) {
      disconnect();
    }
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    });
    navigate("/");
  };
  
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
        isActive(to) ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="gradient-hero bg-clip-text text-transparent">ImpactX</span>
          <span>🌿</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <NavLink to="/dashboard" label="Dashboard" />
        <NavLink to="/challenges" label="Challenges" />
        <NavLink to="/leaderboard" label="Leaderboard" />
        <NavLink to="/metrics" label="Metrics" />
        <NavLink to="/nft" label="NFT" />
        <NavLink to="/registry" label="Registry" />
        <NavLink to="/pool" label="Sponsor Pool" />
        <NavLink to="/about" label="About" />
        <NavLink to="/verifier" label="Verifier" />
        {wagmiAccount.address && <NavLink to={`/u/${wagmiAccount.address}`} label="My Profile" />}
      </div>
      <div className="border-t border-border p-3 space-y-3">
        {(isConnected || wagmiAccount.isConnected) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono">{formatAddress(wagmiAccount.address || walletAddress)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(chainId || CELO_MAINNET_ID)}
                onValueChange={(val) => {
                  const target = Number(val);
                  const targetChain = chains.find((c) => c.id === target);
                  if (targetChain) switchChain({ chainId: targetChain.id });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(CELO_MAINNET_ID)}>Celo Mainnet</SelectItem>
                  <SelectItem value={String(CELO_ALFAJORES_ID)}>Celo Alfajores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{nativeBal ? `${Number(nativeBal.formatted).toFixed(3)} ${nativeBal.symbol}` : "--"}</span>
              {cusdFormatted && <span>{cusdFormatted} cUSD</span>}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar with menu */}
      <div className="md:hidden border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="gradient-hero bg-clip-text text-transparent">ImpactX</span>
            <span>🌿</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-border bg-card z-40">
        <SidebarContent />
      </aside>
    </>
  );
};
