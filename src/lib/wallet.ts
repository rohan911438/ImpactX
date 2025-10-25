import { createConfig, http } from "wagmi";
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
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [celoSepolia.id]: http(),
    [sepolia.id]: http(),
  },
});

export const CELO_MAINNET_ID = celo.id; // 42220
export const CELO_ALFAJORES_ID = celoAlfajores.id; // 44787
export const CELO_SEPOLIA_ID = celoSepolia.id; // 11142220
export const SEPOLIA_ID = sepolia.id; // 11155111
