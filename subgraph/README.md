# ImpactX Subgraph Scaffold

This is a scaffold for a future subgraph that indexes on-chain events related to ImpactX:

- ImpactVerified: emitted when an action is AI-verified
- ImpactAttested: emitted when an EAS-style attestation is recorded
- PoolCreated: emitted for a new weekly sponsor pool

Currently, the app uses an off-chain MVP. When contracts are deployed, update:

- `subgraph.yaml` network, address, startBlock
- `abis/ImpactX.json` to the actual contract ABI
- `src/mapping.ts` handlers accordingly

Dev steps (optional):

1. Install graph-cli tooling
2. Codegen & build
3. Authenticate and deploy to a hosted/subgraph node

This folder acts as documentation + starting point; it is not wired into the app build.
