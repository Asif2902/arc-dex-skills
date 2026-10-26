---
name: arc-dex-subgraph
description: Build and deploy a fast, minimal subgraph (The Graph / Goldsky) for a Uniswap V2-style DEX on Arc, so the frontend can show one user's liquidity positions and the full pools list without looping RPC calls. Use whenever the user mentions subgraph, indexing, indexer, The Graph, Goldsky, "pools page", "my liquidity", "user positions", "load all pools", or slow RPC reads for a V2 fork (Factory/Pair/Router), even if they do not say "subgraph". Ships a ready template, so do not design from scratch.
---

# Arc DEX subgraph (Uniswap V2 fork)

**Goal: ship a working subgraph in minutes from the bundled `template/`. Do not redesign the schema, add price oracles, day-data, or extra entities unless the user asks.**

## Why it exists
The frontend needs two things that are slow over RPC:
1. **One user's liquidity** → `liquidityPositions(where: {user})`. One query. No scanning every pool.
2. **All pools** → `pairs(orderBy: tvlUSD)`. One query. No per-pool `getReserves`/`token0`/`token1` calls.

## Inputs (ask once, in a single message, only for what is missing)
- Network: Arc mainnet (chain 5042) or testnet (5042002)
- **Factory address** and **its deploy block** (from the deploy transaction; never guess, a wrong `startBlock` silently skips pools)
- Hosting: The Graph Studio or Goldsky
- Path to the contract files (`.sol`). Read them, do not ask the user to paste.

## Steps
1. **Check the contracts (30 seconds).** In the `.sol` files, confirm these event signatures exist. Renaming contracts does not change them, so a normal Uniswap V2 fork matches the template as is:
   - Factory: `PairCreated(address indexed token0, address indexed token1, address pair, uint)`
   - Pair: `Sync(uint112,uint112)`, `Swap(address indexed,uint,uint,uint,uint,address indexed)`, `Transfer(address indexed,address indexed,uint)`
   If any differ, fix the matching line in `template/subgraph.yaml` and the event in `template/abis/*.json`. Otherwise leave them alone.
2. **Copy `template/` to `subgraph/`** in the user's project.
3. **Fill `subgraph.yaml`:** `network`, Factory `address`, `startBlock`. Also set `USDC_ADDRESS` in `src/helpers.ts` if the chain's USDC differs (Arc ERC-20 interface is `0x3600000000000000000000000000000000000000`, 6 decimals).
4. **Build:** `npm i && npx graph codegen && npx graph build`. Fix compile errors before anything else. The template was written carefully but compiled nowhere, so expect to touch a type or two.
5. **Deploy** (see Hosting). Wait for sync, then run the sanity queries in `references/queries.md`.
6. **Wire the frontend** with the queries in `references/queries.md`. If the project also uses the `arc-dex-frontend` skill, its pools page and positions list should call these queries first and fall back to RPC only on error.

## What the template indexes (and nothing more)
- `Factory.PairCreated` → creates a `Pair` + `Token`s, starts a dynamic `Pair` data source.
- `Pair.Sync` → current `reserve0` / `reserve1` and `tvlUSD`.
- `Pair.Transfer` (the LP token) → `totalSupply` and each user's `LiquidityPosition.liquidity`.
- `Pair.Swap` → `volumeUSD`, `txCount`, and a light `Swap` row for an activity feed.

`tvlUSD` / `volumeUSD` are only non-zero for pools with a USDC side (value = 2 × USDC reserve). That is intentional; do not add a price oracle.

## Rules that stop the usual mistakes
- **LP balances come from `Transfer`, not `Mint`/`Burn`.** The template skips the zero address and the pair itself (the pair briefly holds LP during `burn`). The first mint also emits `Transfer(0x0 → 0x0)` for the locked 1,000 units; the template counts it into `totalSupply` and does not subtract it.
- **Do not index the USDC token's own `Transfer` events.** On Arc, USDC movements are logged by two emitters (a native system emitter and the ERC-20 contract), so volume would double-count. Pair events only.
- **Decimals:** reserves are raw token units (USDC = 6). The LP token is 18 decimals regardless. Convert in the frontend using each token's `decimals`.
- **Addresses in queries must be lowercase** (`user: "0xabc…"`).
- **Entity ids are lowercase hex strings;** position id = `pairId-userAddress`.
- **Block timestamps on Arc can repeat** (sub-second blocks). Order by `blockNumber`, then `logIndex`, never by timestamp alone.
- **Do not call contracts inside handlers** except token `name/symbol/decimals` at pair creation (already done with `try_` and safe fallbacks).
- **Lag:** a subgraph is a few seconds behind. After the user's own transaction, refetch with a short poll or read that one pool directly over RPC; do not wait for the subgraph to show it.
- **If the contracts changed after deploy** (new Factory address), deploy a new subgraph version. Do not patch the entity ids.

## Hosting (verify before promising)
- **The Graph:** its supported-networks list shows Arc as a mainnet entry with network id `arc` (that listing does not mention a testnet). Confirm in Subgraph Studio that `arc` is accepted before deploying.
- **Goldsky:** its chain list shows Subgraphs support for both Arc mainnet and Arc Testnet. The exact network slug for `subgraph.yaml` was not published on the page checked; confirm in Goldsky's subgraph docs or CLI before deploying.
- Studio: `npx graph auth` then `npx graph deploy <name>`. Goldsky: `goldsky subgraph deploy <name>/<version> --path .`.
- If the chosen host does not accept Arc yet, tell the user plainly and fall back to RPC reads (see the frontend skill), instead of faking the network name.

## Done means
- `graph build` passes.
- `pairs(first: 5)` returns pools with correct `token0`/`token1` and non-zero reserves after a test add-liquidity.
- `liquidityPositions(where: {user: "<test wallet lowercase>"})` returns that wallet's LP balance, and it goes to `0` after removing all liquidity.
