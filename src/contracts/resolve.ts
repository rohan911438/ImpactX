import { CONTRACTS } from "./addresses";

export type Contracts = Partial<{
  ImpactNFT: `0x${string}`;
  ImpactRegistry: `0x${string}`;
  SponsorPool: `0x${string}`;
  SponsorToken: `0x${string}`;
}>;

const isHexAddress = (v: string | undefined | null): v is `0x${string}` => !!v && /^0x[a-fA-F0-9]{40}$/.test(v);

export function getDefaultContracts(chainId?: number): Contracts {
  // Only Celo Sepolia is predefined in this repo.
  if (chainId === 11142220) {
    return CONTRACTS.celoSepolia as unknown as Contracts;
  }
  return {};
}

export function getSavedContracts(chainId?: number): Contracts {
  if (!chainId) return {};
  try {
    const raw = localStorage.getItem(`impactx:contracts:${chainId}`);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const out: Contracts = {};
    if (isHexAddress(obj.ImpactNFT)) out.ImpactNFT = obj.ImpactNFT;
    if (isHexAddress(obj.ImpactRegistry)) out.ImpactRegistry = obj.ImpactRegistry;
    if (isHexAddress(obj.SponsorPool)) out.SponsorPool = obj.SponsorPool;
    if (isHexAddress(obj.SponsorToken)) out.SponsorToken = obj.SponsorToken;
    return out;
  } catch {
    return {};
  }
}

export function saveContracts(chainId: number, c: Contracts) {
  const clean: Record<string, string> = {};
  if (isHexAddress(c.ImpactNFT)) clean.ImpactNFT = c.ImpactNFT;
  if (isHexAddress(c.ImpactRegistry)) clean.ImpactRegistry = c.ImpactRegistry;
  if (isHexAddress(c.SponsorPool)) clean.SponsorPool = c.SponsorPool;
  if (isHexAddress(c.SponsorToken)) clean.SponsorToken = c.SponsorToken;
  localStorage.setItem(`impactx:contracts:${chainId}`, JSON.stringify(clean));
}

export function resolveContracts(chainId?: number): Contracts {
  const defs = getDefaultContracts(chainId);
  const saved = getSavedContracts(chainId);
  return { ...defs, ...saved };
}
