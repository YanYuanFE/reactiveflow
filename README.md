# ReactiveFlow

**On-chain IFTTT workflow orchestrator powered by Somnia Reactivity.**

ReactiveFlow lets users create automated workflows that react to on-chain events — no bots, no keepers, no off-chain infrastructure. Define a trigger, set a condition, pick an action. The Somnia Reactivity precompile handles the rest.

> WHEN a token transfer happens → ONLY IF amount >= 10,000 USDC → THEN emit an alert

```
┌──────────────┐     Somnia Validators     ┌──────────────────┐
│  ERC-20      │──── detect Transfer ─────>│  ReactiveFlow    │
│  Contract    │     event on-chain        │  ._onEvent()     │
└──────────────┘                           │                  │
                                           │  match trigger   │
                                           │  check condition │
                                           │  execute action  │
                                           └──────────────────┘
```

## How It Works

ReactiveFlow leverages [Somnia On-Chain Reactivity](https://docs.somnia.network/developer/reactivity) — a native protocol where validators automatically invoke smart contract callbacks when subscribed events fire. This eliminates the need for off-chain watchers entirely.

1. **User creates a Flow** via the web UI (trigger + condition + action)
2. **Backend registers a Reactivity subscription** through the precompile at `0x0100`
3. **When the event fires**, Somnia validators call `ReactiveFlow._onEvent()`
4. **The contract evaluates conditions** and executes the action atomically in the same block

### Trigger Types

| Type | Description | Example |
|------|-------------|---------|
| Token Transfer | ERC-20 `Transfer` events | USDC whale movements |
| Price Threshold | DIA Oracle price updates | ETH/USD drops below $2,000 |
| DEX Swap | DEX swap events | Large swaps on any pair |
| Custom Event | Any contract event | Governance proposals, NFT mints |

### Condition Operators

`>`, `<`, `>=`, `<=`, `==`, `!=`, or `NONE` (always execute)

Conditions evaluate either:
- **PRICE** — reads from DIA Oracle with 1-hour staleness check
- **AMOUNT** — extracts a uint256 from event data at a configurable byte offset

### Action Types

| Action | Description |
|--------|-------------|
| Transfer Token | Send ERC-20 from user deposits to a recipient |
| Swap Tokens | Execute a DEX swap via any router contract |
| Contract Call | Call any function on any contract (up to 3M gas) |
| Emit Alert | Emit an on-chain alert event for monitoring |

## Architecture

```
reactiveflow/
├── packages/
│   ├── contracts/          # Solidity — ReactiveFlow.sol
│   │   ├── contracts/
│   │   ├── test/           # Hardhat + viem tests
│   │   └── scripts/        # Deploy, setup demos, create subscriptions
│   ├── frontend/           # React + Vite + TailwindCSS + shadcn/ui
│   │   └── src/
│   │       ├── pages/      # Landing, Dashboard, CreateFlow, FlowList, etc.
│   │       ├── components/ # Flow builder wizard, token selector, wallet
│   │       ├── hooks/      # useCreateFlow, useUserFlows, useDeposit
│   │       └── config/     # Contract ABIs, addresses, templates
│   └── server/             # Hono + Prisma + PostgreSQL
│       └── src/
│           ├── routes/     # REST API for events & subscriptions
│           └── services/   # Event indexer, subscription manager, DB
```

### Smart Contract (`ReactiveFlow.sol`)

Single-contract design combining the flow registry and execution engine. Key design decisions:

- **Trigger indexing** via `keccak256(eventSig, emitter)` for O(1) flow lookup
- **Topic filtering** with `bytes32[3]` wildcards (`bytes32(0)` = match any)
- **Deposit system** so users pre-fund token transfers and swaps
- **ReentrancyGuard** on all deposit/withdraw operations
- **Max 10 flows per trigger** to bound gas costs in `_onEvent()`

### Backend Server

- **Event Indexer** — polls the chain for `FlowExecuted` / `AlertEmitted` events, persists to PostgreSQL
- **Subscription Manager** — creates Reactivity subscriptions on-demand via `@somnia-chain/reactivity` SDK
- **SSE Streaming** — real-time event push to the frontend via Server-Sent Events
- **Prisma 7** with `@prisma/adapter-pg` for PostgreSQL schema isolation

### Frontend

- **4-step flow builder** — Trigger → Condition → Action → Review
- **Template library** — Whale Alert, Price Guardian, Cross-Contract, Smart DCA
- **Real-time dashboard** — execution history with live SSE updates
- **Deposit management** — approve, deposit, and withdraw ERC-20 tokens
- **Wallet integration** — RainbowKit + wagmi + viem

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm
- PostgreSQL database

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
# packages/contracts/.env
PRIVATE_KEY=0x...

# packages/server/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/reactiveflow"
PRIVATE_KEY=0x...
REACTIVE_FLOW_ADDRESS=0xd87d10cc49c3d04dac256b533f95547017204e16
```

### 3. Deploy contracts (optional — already deployed on Somnia Testnet)

```bash
pnpm build:contracts
pnpm deploy
```

### 4. Set up the database

```bash
cd packages/server
pnpm exec prisma db push
```

### 5. Start development

```bash
# From root — starts both frontend and backend
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Deployed Contracts (Somnia Testnet)

| Contract | Address |
|----------|---------|
| ReactiveFlow | `0xd87d10cc49c3d04dac256b533f95547017204e16` |
| Reactivity Precompile | `0x0000000000000000000000000000000000000100` |
| DIA Oracle V2 | `0xbA0E0750A56e995506CA458b2BdD752754CF39C4` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/events` | List indexed events (supports `?limit`, `?offset`, `?flowId`) |
| GET | `/api/events/stream` | SSE stream for real-time events |
| GET | `/api/subscriptions` | List all Reactivity subscriptions |
| POST | `/api/subscriptions` | Create a new subscription |
| DELETE | `/api/subscriptions/:id` | Remove a subscription |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat 3, OpenZeppelin, viem |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, wagmi, RainbowKit |
| Backend | Hono, Prisma 7, PostgreSQL, viem |
| Reactivity | `@somnia-chain/reactivity` SDK, Reactivity Precompile |
| Monorepo | pnpm workspaces |

## Testing

```bash
# Run contract tests
pnpm test:contracts
```

## License

MIT
