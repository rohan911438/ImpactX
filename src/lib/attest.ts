import { hexToBytes } from 'viem';

export type ImpactClaim = {
  wallet: `0x${string}`;
  impactId: string;
  actionType: string;
  aiScore: number;
  createdAt: number;
  imageHash: `0x${string}`;
  locationHash: `0x${string}`;
  descriptionHash: `0x${string}`;
  chainId: number;
};

export const domain = (chainId: number) => ({ name: 'ImpactX', version: '1', chainId });

export const types = {
  ImpactClaim: [
    { name: 'wallet', type: 'address' },
    { name: 'impactId', type: 'string' },
    { name: 'actionType', type: 'string' },
    { name: 'aiScore', type: 'uint256' },
    { name: 'createdAt', type: 'uint256' },
    { name: 'imageHash', type: 'bytes32' },
    { name: 'locationHash', type: 'bytes32' },
    { name: 'descriptionHash', type: 'bytes32' },
    { name: 'chainId', type: 'uint256' },
  ],
} as const;

function toHex(u8: Uint8Array): `0x${string}` {
  return ('0x' + Array.from(u8).map((b) => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
}

export function toBytes32(hex: string): `0x${string}` {
  // Accept 0x-prefixed hex; zero-pad or hash externally if needed.
  const clean = hex.toLowerCase();
  if (clean.length === 66 && clean.startsWith('0x')) return clean as `0x${string}`;
  // fallback: right-truncate/left-pad to 32 bytes (not cryptographically safe; use keccak for real hashing)
  const no0x = clean.startsWith('0x') ? clean.slice(2) : clean;
  const bytes = hexToBytes(`0x${no0x}` as `0x${string}`);
  const out = new Uint8Array(32);
  out.set(bytes.slice(-32), 32 - Math.min(32, bytes.length));
  return toHex(out);
}
