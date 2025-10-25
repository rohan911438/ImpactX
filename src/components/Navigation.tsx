import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount, useDisconnect, useChainId, useSwitchChain, useBalance, useReadContract } from "wagmi";
import { CELO_ALFAJORES_ID, CELO_MAINNET_ID } from "@/lib/wallet";

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
  
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="gradient-hero bg-clip-text text-transparent">ImpactX</span>
            <span>🌿</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/challenges" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/challenges") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Challenges
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/leaderboard") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/metrics" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/metrics") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Metrics
            </Link>
            <Link 
              to="/nft" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/nft") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              NFT
            </Link>
            <Link 
              to="/registry" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/registry") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Registry
            </Link>
            <Link 
              to="/pool" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/pool") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Sponsor Pool
            </Link>
            <Link 
              to="/about" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/about") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            <Link 
              to="/verifier" 
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/verifier") ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Verifier
            </Link>
            {wagmiAccount.address && (
              <Link
                to={`/u/${wagmiAccount.address}`}
                className={`text-sm transition-colors hover:text-primary ${
                  location.pathname.startsWith(`/u/`) ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                My Profile
              </Link>
            )}
          </div>
        </div>
        
        {(isConnected || wagmiAccount.isConnected) && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono">{formatAddress(wagmiAccount.address || walletAddress)}</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-sm font-semibold text-accent">
                {nativeBal ? `${Number(nativeBal.formatted).toFixed(3)} ${nativeBal.symbol}` : "--"}
              </span>
              {cusdFormatted && (
                <>
                  <span className="text-xs text-muted-foreground">|</span>
                  <span className="text-sm font-semibold text-accent">{cusdFormatted} cUSD</span>
                </>
              )}
            </div>
            <Select
              value={String(chainId || CELO_MAINNET_ID)}
              onValueChange={(val) => {
                const target = Number(val);
                const targetChain = chains.find((c) => c.id === target);
                if (targetChain) switchChain({ chainId: targetChain.id });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(CELO_MAINNET_ID)}>Celo Mainnet</SelectItem>
                <SelectItem value={String(CELO_ALFAJORES_ID)}>Celo Alfajores</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
