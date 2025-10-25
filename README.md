# ImpactX — Proof-of-Impact on Celo (Hackathon Submission)

Team: BROTHERHOOD · Author: Rohan Kumar

ImpactX lets people submit real-world actions (photos/videos + context), get AI-verified, and receive on-chain Proof‑of‑Impact (PoI) NFTs and token rewards. This repo includes a working React app, a lightweight backend, and three smart contracts deployed on Celo Sepolia.

Quick links for judges

- Deployer wallet (Celo Sepolia): [0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56](https://sepolia.celoscan.io/address/0x8b550ff0ba4f55f070cafa161e44e84abedbbc56)
- ImpactNFT: [0x179B30bA56985D1e358a1d22BCfC1d1d0595De45](https://sepolia.celoscan.io/address/0x179B30bA56985D1e358a1d22BCfC1d1d0595De45) — Verified on CeloScan
- ImpactRegistry: [0xD4fcbA9301d11DF04F5bA3361D5962b15D761705](https://sepolia.celoscan.io/address/0xD4fcbA9301d11DF04F5bA3361D5962b15D761705) — Sourcify verified
- SponsorPool: [0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C](https://sepolia.celoscan.io/address/0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C) — Sourcify verified

All three addresses are on Celo Sepolia Testnet (chainId 11142220).

## Contracts and proofs

ImpactNFT (ERC‑721)

- Address: [0x179B30bA56985D1e358a1d22BCfC1d1d0595De45](https://sepolia.celoscan.io/address/0x179B30bA56985D1e358a1d22BCfC1d1d0595De45)
- Status: ✅ Verified on CeloScan
- Creation tx: [0x90b6…c57b](https://sepolia.celoscan.io/tx/0x90b6c8b16c0ca55be162c858f0a16fb99076ead43e7c1e2129a82732dbe8c57b) (block 8095068)
- Owner: 0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56
- Constructor: name = "Impact NFT", symbol = "IMPACT"
- Compiler: v0.8.30 (optimizer OFF, runs 200)
- Source: contracts/ImpactNFT.sol (SPDX: MIT; OZ 4.9.5)

ImpactRegistry

- Address: [0xD4fcbA9301d11DF04F5bA3361D5962b15D761705](https://sepolia.celoscan.io/address/0xD4fcbA9301d11DF04F5bA3361D5962b15D761705)
- Status: ✅ Sourcify verified — https://repo.sourcify.dev/11142220/0xD4fcbA9301d11DF04F5bA3361D5962b15D761705/
- Creation tx: [0x3019…abed](https://sepolia.celoscan.io/tx/0x3019ea4c8965521c9ba7d736732032b1b5b1c0029a11f3eeb293b407d250abed) (block 8100868)
- Owner: 0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56
- Relationship: setNFTContract(ImpactNFT), then ImpactNFT.setMinter(ImpactRegistry, true)
- Compiler: v0.8.30 (optimizer OFF, runs 200)
- Source: contracts/ImpactRegistry.sol (SPDX: MIT; uses ReentrancyGuard)

SponsorPool

- Address: [0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C](https://sepolia.celoscan.io/address/0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C)
- Status: ✅ Sourcify verified — https://repo.sourcify.dev/11142220/0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C/
- Creation tx: [0x4feb…b5c3](https://sepolia.celoscan.io/tx/0x4febca762fec134f7cdecc4a15ea702e5498ef8d5ec466024caba160b5a6b5c3) (block 8101624)
- Owner: 0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56
- Constructor token_: 0xC71835dC515baD2464E62377E82D8391F891b91D (ERC‑20 used for this pool)
- Compiler: v0.8.30 (optimizer OFF, runs 200)
- Source: contracts/SponsorPool.sol (SPDX: MIT; SafeERC20 + ReentrancyGuard)

Optional Test Token

- contracts/MockERC20.sol is included for quick test deployments if needed.

## Deployer wallet proof

Wallet: [0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56](https://sepolia.celoscan.io/address/0x8b550ff0ba4f55f070cafa161e44e84abedbbc56) (Celo Sepolia)

Notable recent transactions (Celo Sepolia)

- 0x90b6…c57b — Contract creation: ImpactNFT (block 8095068)
- 0x3019…abed — Contract creation: ImpactRegistry (block 8100868)
- 0x4feb…b5c3 — Contract creation: SponsorPool (block 8101624)
- 0x139a…ba29, 0xf71d…8a67, 0xb19b…c433 — Incoming 3 CELO funding txs from 0x127C22b9…5469065f8 (earlier)

View full history: CeloScan wallet page linked above.

## Submission metadata

- Team: BROTHERHOOD
- Author: Rohan Kumar
- Network: Celo Sepolia (chainId 11142220)
- Language/Stack: Solidity 0.8.30 (OZ 4.9.5), React + Vite + TypeScript, Express (mock API)

## How to reproduce (Remix)

Compiler settings used for verification

- Solidity: v0.8.30
- Optimization: OFF
- Runs: 200

Deploy order

1) Deploy ImpactNFT(name = "Impact NFT", symbol = "IMPACT")
2) Deploy ImpactRegistry()
3) Call ImpactRegistry.setNFTContract(<ImpactNFT>)
4) Call ImpactNFT.setMinter(<ImpactRegistry>, true)
5) Deploy SponsorPool(token_ = <ERC‑20 address, e.g. MockERC20>)

SponsorPool usage

1) token.approve(<SponsorPool>, amount)
2) SponsorPool.contribute(amount)
3) SponsorPool.distribute([addr1, addr2], [70, 30], totalAmount) — owner only

## Run locally (frontend + API)

Requirements: Node.js 18+

Install & run

```cmd
npm i
npm run dev:all      # Runs API (http://localhost:8787) and Frontend (http://localhost:8080)

# Or run separately if you prefer:
npm run dev:server   # API on http://localhost:8787
npm run dev          # Frontend on http://localhost:8080
```

Wallet integration

- MetaMask via wagmi (Celo Mainnet/Alfajores; Sepolia-compatible for testing)
- Optional WalletConnect (Valora): set VITE_WALLETCONNECT_PROJECT_ID in .env

```cmd
echo VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here> .env
```

## Architecture

- Frontend: Vite + React + TypeScript, Tailwind + shadcn‑ui, wagmi/viem
- Backend: Express + multer + lowdb (JSON) — mock verification + leaderboard/profile endpoints
- Contracts: ImpactNFT (ERC‑721), ImpactRegistry (verifier + optional mint), SponsorPool (ERC‑20 pool)
- Subgraph scaffold: /subgraph (for future indexing)

## API routes (MVP)

- GET /api/leaderboard — public leaderboard data
- GET /api/verifications — list of verification requests
- GET /api/public/metrics — aggregate metrics for the Metrics page

## Security and notes

- Contracts use OpenZeppelin 4.9.5. Registry/Pool guarded with ReentrancyGuard; Pool validates non‑zero recipients.
- ImpactNFT uses ERC721URIStorage for per‑token metadata; URIs are mutable by design for MVP (documented trade‑off).
- This is an MVP; before mainnet, consider role-based access (AccessControl), pausability, limits, and audits.

## Judging checklist

- Contracts deployed on Celo Sepolia with verifiable addresses and creation txs
- ImpactNFT verified on CeloScan; Registry/Pool verified via Sourcify
- Repo includes runnable frontend and mock backend with real UI flows
- Clear README with links, steps, and security considerations

## Files to review (source of truth)

- contracts/ImpactNFT.sol
- contracts/ImpactRegistry.sol
- contracts/SponsorPool.sol
- contracts/MockERC20.sol (optional test token)

If you need any additional artifacts (flattened sources, ABIs), we can attach them or point to the verified explorer pages.
