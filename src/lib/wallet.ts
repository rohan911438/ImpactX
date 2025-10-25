import { createConfig, http } from "wagmi";
import { fallback } from "viem";
import { celo, celoAlfajores, sepolia } from "viem/chains";
import { celoSepolia } from "./chains";
import { metaMask } from "wagmi/connectors";

const connectors = [metaMask()];

export const wagmiConfig = createConfig({
  autoConnect: true,
  // Add Ethereum Sepolia alongside Celo networks
  chains: [celo, celoAlfajores, celoSepolia, sepolia],
  connectors,
  transports: {
    // Prefer explicit, stable RPCs with fallbacks to avoid "HTTP request failed" during reads
    [celo.id]: fallback([
      http(import.meta.env.VITE_RPC_CELO || "https://forno.celo.org", { timeout: 10_000 }),
    ]),
    [celoAlfajores.id]: fallback([
      http(import.meta.env.VITE_RPC_ALFAJORES || "https://alfajores-forno.celo-testnet.org", { timeout: 10_000 }),
    ]),
    [celoSepolia.id]: fallback([
      http(import.meta.env.VITE_RPC_CELOSEPOLIA || celoSepolia.rpcUrls.default.http[0], { timeout: 10_000 }),
    ]),
    [sepolia.id]: fallback([
      // Multiple public endpoints to reduce flakiness
      http(import.meta.env.VITE_RPC_SEPOLIA || "https://rpc.sepolia.org", { timeout: 10_000 }),
      http("https://ethereum-sepolia-rpc.publicnode.com", { timeout: 10_000 }),
      http("https://endpoints.omniatech.io/v1/eth/sepolia/public", { timeout: 10_000 }),
    ]),
  },
});

export const CELO_MAINNET_ID = celo.id; // 42220
export const CELO_ALFAJORES_ID = celoAlfajores.id; // 44787
export const CELO_SEPOLIA_ID = celoSepolia.id; // 11142220
export const SEPOLIA_ID = sepolia.id; // 11155111
