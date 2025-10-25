# ImpactX Contracts (Remix-ready)

This folder contains minimal smart contracts you can deploy with Remix to bring your ImpactX MVP on-chain on Celo (Alfajores testnet or Mainnet).

Contracts:
- ImpactNFT.sol — ERC721 for Proof-of-Impact NFTs, with per-token metadata URIs and a simple minter authorization.
- ImpactRegistry.sol — On-chain registry to submit and verify impacts; can optionally mint an NFT upon verification.
- SponsorPool.sol — Simple ERC20 sponsor pool for collecting contributions and distributing to recipients by weights (e.g., using cUSD).

All contracts import OpenZeppelin via GitHub URLs, so you can paste or drag-and-drop them directly into Remix without additional setup.

## Deployed addresses
Recorded deployments for quick reference.

- Network: Celo Sepolia Testnet
   - ImpactNFT: `0x179B30bA56985D1e358a1d22BCfC1d1d0595De45`
   - Tx Hash: `0x90b6c8b16c0ca55be162c858f0a16fb99076ead43e7c1e2129a82732dbe8c57b`
   - Block: `8095068`
   - Deployer: `0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56`
   - Verification: ✅ Verified on CeloScan
   - Compiler: `v0.8.30` (Optimization: `false`, Runs: `200`)
   - Constructor Args: `name = "Impact NFT"`, `symbol = "IMPACT"`
   - Notes: The Solidity source includes `// SPDX-License-Identifier: MIT`.

   - ImpactRegistry: `0xD4fcbA9301d11DF04F5bA3361D5962b15D761705`
    - Tx Hash: `0x3019ea4c8965521c9ba7d736732032b1b5b1c0029a11f3eeb293b407d250abed`
    - Block: `8100868`
    - Deployer: `0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56`
    - Verification: ✅ Sourcify verified — https://repo.sourcify.dev/11142220/0xD4fcbA9301d11DF04F5bA3361D5962b15D761705/
    - Notes: Emits `OwnershipTransferred` to the deployer on creation. Use `setNFTContract(<ImpactNFT>)` then authorize in `ImpactNFT.setMinter(<ImpactRegistry>, true)`.

   - SponsorPool: `0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C`
    - Tx Hash: `0x4febca762fec134f7cdecc4a15ea702e5498ef8d5ec466024caba160b5a6b5c3`
    - Block: `8101624`
    - Deployer: `0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56`
    - Constructor token_: `0xC71835dC515baD2464E62377E82D8391F891b91D`
    - Verification: ✅ Sourcify verified — https://repo.sourcify.dev/11142220/0x2aB068440E8D2006B9bA2f2995932Cb4fC33e21C/
    - Usage: Holder calls `approve(SponsorPool, amount)` then `contribute(amount)`. Owner calls `distribute(recipients, weights, totalAmount)`.

## Recommended network tokens
- Celo Mainnet cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Celo Alfajores cUSD (testnet): `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

## Quick deploy with Remix
1. Open https://remix.ethereum.org
2. Create a new workspace or use "Default".
3. Add a `contracts/` folder and drag-drop the three `.sol` files from this repo (or copy-paste their contents).
4. In the Solidity compiler tab:
   - Select compiler version `0.8.30` (matches the verified deployment).
   - Enable auto-compile if you prefer.
   - Compile each contract.
5. In the Deploy & Run tab:
   - Select the desired environment (Injected Provider for MetaMask/MetaMask + Celo RPC).
   - Choose the contract to deploy and provide constructor params when prompted.

### Deploy order
You can deploy any subset depending on your needs. A common flow:
1) Deploy `ImpactNFT` with a name/symbol, e.g.:
   - name: `ImpactX`
   - symbol: `IMPACT`
2) Deploy `ImpactRegistry` (no params).
3) (Optional) In `ImpactRegistry`, call `setNFTContract(<ImpactNFT_address>)`.
   - Then in `ImpactNFT`, call `setMinter(<ImpactRegistry_address>, true)` so the registry can mint on verify.
4) Deploy `SponsorPool` with the token address (e.g., cUSD address above).

### SponsorPool quick deploy (Celo Sepolia)

If you don’t have a known ERC20 on Celo Sepolia, you can deploy a test token first:

1) Deploy `MockERC20` with:
   - name: `Test cUSD`
   - symbol: `TcUSD`
   - initialSupply: `1000000000000000000000000`  (1,000,000 with 18 decimals)
   - After deploy, copy the token address from Remix or Blockscout.
2) Deploy `SponsorPool` passing `token_ = <your MockERC20 address>` in the constructor field.
3) To fund the pool, either:
   - From any account holding the token: call the token’s `approve(<SponsorPool>, amount)` then call `SponsorPool.contribute(amount)`, or
   - As the token owner: call `MockERC20.mint(<your address>, amount)` first, then approve+contribute.
4) Distribution (admin action): call `distribute(recipients, weights, totalAmount)`.
   - Example: recipients `[0xabc..., 0xdef...]`, weights `[70, 30]`, `totalAmount = 1000e18`.
   - Ensure `SponsorPool` has at least `totalAmount` balance before distributing.

Verification settings (explorers):
- Compiler: `v0.8.30`
- Optimization: `false`
- Runs: `200`
- Constructor arguments: one address (`token_`)

### Typical interactions
- Users call `ImpactRegistry.submitImpact(actionType, metadataURI)` to submit a proof (e.g., with IPFS metadata).
- Your backend/admin (owner) calls `ImpactRegistry.verifyImpact(id, aiScore, reward, mintNFT)` to mark it verified and optionally mint an NFT.
- Sponsors approve and call `SponsorPool.contribute(amount)` to fund the pool.
- Admin uses `SponsorPool.distribute(recipients, weights, totalAmount)` to pay out.

## Integration notes
- Keep your existing off-chain MVP running; you can emit on-chain events and store minimal data to align with future indexing (subgraph) plans.
- If you want stricter roles instead of `onlyOwner`, extend with `AccessControl` and define roles for verifiers and distributors.
- Gas costs: strings and per-token URIs are convenient for Remix; for larger scale, consider compact types (bytes32) and off-chain URIs.

## Safety
- These contracts are provided as an MVP. Before mainnet, consider audits, pausability, and richer role/limit checks.
- SponsorPool distributes proportionally; rounding dust stays in the contract and can be withdrawn by owner.

## Troubleshooting (Remix)
- If imports fail: ensure Remix has internet access, or replace GitHub URL imports with local copies of OpenZeppelin contracts.
- If transactions fail: check you’re on the correct Celo network and have sufficient CELO to pay gas.
