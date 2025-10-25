import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "viem/chains";
import { celoSepolia } from "./chains";
import { metaMask } from "wagmi/connectors";

const connectors = [metaMask()];

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores, celoSepolia],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [celoSepolia.id]: http(),
  },
});

export const CELO_MAINNET_ID = celo.id; // 42220
export const CELO_ALFAJORES_ID = celoAlfajores.id; // 44787
export const CELO_SEPOLIA_ID = celoSepolia.id; // 11142220
