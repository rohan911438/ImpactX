import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { CELO_MAINNET_ID } from "@/lib/wallet";

export const WalletConnect = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMaskConnector =
    connectors.find((c) => c.id === "io.metamask") ||
    connectors.find((c) => c.name.toLowerCase().includes("metamask")) ||
    connectors.find((c) => c.id === "injected");
  const walletConnectConnector = connectors.find((c) => c.id === "walletConnect" );

  const isMetaMaskInstalled = typeof window !== "undefined" &&
    // @ts-expect-error - ethereum injected by MetaMask
    typeof window.ethereum !== "undefined" && window.ethereum?.isMetaMask;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleConnectMetaMask = async () => {
    if (!isMetaMaskInstalled) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to connect: https://metamask.io/",
        variant: "destructive",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    if (!metaMaskConnector) {
      toast({ title: "Connector not available", description: "Reload the page and try again.", variant: "destructive" });
      return;
    }
    try {
      await connectAsync({ connector: metaMaskConnector, chainId: CELO_MAINNET_ID });
      toast({ title: "Wallet connected" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Connection failed", description: message, variant: "destructive" });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({ title: "Disconnected" });
  };

  if (isConnected) {
    return (
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <Button variant="outline" size="sm" className="font-mono">
          {shortAddress}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-2">
      <Button 
        variant="default" 
        size="lg"
        onClick={handleConnectMetaMask}
        disabled={connectStatus === "pending"}
        className="gap-2"
      >
        <Wallet className="w-5 h-5" />
        Connect MetaMask
      </Button>
      {walletConnectConnector && (
        <Button
          variant="outline"
          size="lg"
          onClick={async () => {
            try {
              await connectAsync({ connector: walletConnectConnector, chainId: CELO_MAINNET_ID });
              toast({ title: "Wallet connected" });
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              toast({ title: "Connection failed", description: message, variant: "destructive" });
            }
          }}
          disabled={connectStatus === "pending"}
        >
          WalletConnect
        </Button>
      )}
    </div>
  );
};
