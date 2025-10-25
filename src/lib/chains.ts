import { defineChain } from "viem";

export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  network: "celo-sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_CELO_SEPOLIA_RPC || "https://sepolia-forno.celo-testnet.org"],
    },
    public: {
      http: [import.meta.env.VITE_CELO_SEPOLIA_RPC || "https://sepolia-forno.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://sepolia.celoscan.io" },
  },
});
