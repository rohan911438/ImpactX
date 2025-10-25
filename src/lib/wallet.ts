import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "viem/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
  | string
  | undefined;

const connectors = [metaMask()];

if (projectId) {
  connectors.push(
    walletConnect({ projectId, showQrModal: true })
  );
}

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
});

export const CELO_MAINNET_ID = celo.id; // 42220
export const CELO_ALFAJORES_ID = celoAlfajores.id; // 44787
