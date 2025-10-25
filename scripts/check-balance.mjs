import { createPublicClient, http, formatEther, getAddress } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

const CUSD = {
  [celo.id]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  [celoAlfajores.id]: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
};

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
];

const addressArg = process.argv[2];
if (!addressArg) {
  console.error('Usage: node scripts/check-balance.mjs <address>');
  process.exit(1);
}

let userAddress;
try {
  userAddress = getAddress(addressArg);
} catch {
  console.error('Invalid address');
  process.exit(1);
}

// Known reliable public RPCs for Celo
const clients = [
  createPublicClient({ chain: celo, transport: http('https://forno.celo.org') }),
  createPublicClient({ chain: celoAlfajores, transport: http('https://alfajores-forno.celo-testnet.org') }),
];

const run = async () => {
  for (const client of clients) {
    const chain = client.chain;
    try {
      const nativeBal = await client.getBalance({ address: userAddress });
      const nativeFormatted = formatEther(nativeBal);

      const cusdAddress = CUSD[chain.id];
      let cusd = null;
      if (cusdAddress) {
        const [raw, decimals] = await Promise.all([
          client.readContract({ address: cusdAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [userAddress] }),
          client.readContract({ address: cusdAddress, abi: ERC20_ABI, functionName: 'decimals' }),
        ]);
        const divisor = 10n ** BigInt(decimals);
        const intPart = raw / divisor;
        const fracPart = raw % divisor;
        const fracStr = (fracPart * 10000n / divisor).toString().padStart(4, '0');
        cusd = `${intPart}.${fracStr.slice(0, 2)}`; // ~2 decimals
      }

      console.log(`\nChain: ${chain.name} (${chain.id})`);
      console.log(`CELO: ${Number(nativeFormatted).toFixed(6)} CELO`);
      if (cusd !== null) console.log(`cUSD: ${cusd} cUSD`);
    } catch (e) {
      console.log(`\nChain: ${client.chain.name} (${client.chain.id})`);
      console.log('Failed to fetch balances:', e?.message ?? e);
    }
  }
};

run();
