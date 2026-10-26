---
name: arc-dex-frontend
description: Rules and code for building or fixing the dApp frontend of a Uniswap V2-style DEX deployed on Arc (swap, add liquidity, remove liquidity, pools page, my positions, token selector, approvals). Use whenever the user works on this DEX's UI, wallet calls, Router/Factory/Pair reads, or says swap, liquidity, pool, LP, approve, Max button, or token pair on Arc. Arc has NO wrapper for its native USDC (no WUSDC or WETH-style wrapper) and USDC is the native gas token with a 6-decimal ERC-20 interface, so generic Uniswap V2 frontend habits (ETH functions, wrap/unwrap, 18 decimals) will break. Read this before writing any contract call.
---

# Arc DEX frontend (Uniswap V2 fork)

Arc facts, chain config, ABIs and code live in `references/`. Read `references/arc-facts.md` first (it has the shared Arc contract addresses: Multicall3, Permit2, EURC, USYC and more), then `references/snippets.md` for the flow you are building. The rules below are the ones AI assistants most often get wrong here.

## Rule 1: Arc has no wrapper for native USDC. Token-to-token only.
- USDC is the gas token **and** a normal ERC-20 at `0x3600000000000000000000000000000000000000` (6 decimals). Treat it as just another token in the selector.
- **Never** call or add to the ABI: `addLiquidityETH`, `removeLiquidityETH`, any `swap…ETH…` function, or the `…SupportingFeeOnTransferTokens` ETH variants. They need a wrapper of the native coin, which does not exist on Arc, and will revert.
- **Never** send `value` (msg.value) on any Router call. **Never** build wrap/unwrap buttons or a "WUSDC" token.
- The Router was deployed with a placeholder WETH address. Do not use `router.WETH()` for anything.
- Arc's docs do list a token called `WETH` (see `references/arc-facts.md`). It is an ordinary ERC-20 you may offer in the token selector. It is **not** the Router's WETH and not a wrapper of USDC: never call `deposit`/`withdraw` on it.
- Only use `addLiquidity`, `removeLiquidity`, `swapExactTokensForTokens`, `swapTokensForExactTokens`, `getAmountsOut`, `getAmountsIn`, `quote`. The ABI in `snippets.md` already contains only these.

## Rule 2: Token order. Sort for contract math, never flip the UI.
- The Pair stores `token0 < token1` by address. `getReserves()` returns `reserve0, reserve1` in **that** order, not in the order the user picked.
- The UI keeps the user's selection order (Token A on top, Token B below). **Do not swap their positions, labels, or inputs.**
- Map reserves to tokens **by address**: compare the user's token to `pair.token0()`. Never assume `reserve0` belongs to the first-selected token. This mix-up is what makes quotes wrong and `INSUFFICIENT_A_AMOUNT` / `INSUFFICIENT_B_AMOUNT` reverts appear.
- When encoding `addLiquidity`/`removeLiquidity`, sort the tokens **at the last moment** with `toRouterOrder()` from `snippets.md`, carrying each amount with its own token. The Router tolerates either order if amounts stay paired with their tokens, so this is a safety net that keeps the Pair's ordering and your min-amount math consistent. The sorted values never go into UI state.
- A pool that does not exist yet (`getPair` returns the zero address) is not an error: the user sets the first price. Show that.

## Rule 3: Loading liquidity and pools. No RPC loops.
- **Multicall3 exists** at `0xcA11bde05977b3631167028862bE2a173976CA11` on both networks, set in the chain definition, so batched `client.multicall` works.
- **Pools page (`/pools`):** one list of all pools with token symbols, reserves, TVL, volume. Source order: (1) the subgraph `pairs` query, (2) fallback: `allPairsLength` → `allPairs(i)` → batched multicall of `token0, token1, getReserves, totalSupply`, then token `symbol/decimals` once, cached. Never call a pool one by one inside a render loop. Paginate (20-50 per page).
- **My liquidity:** (1) subgraph `liquidityPositions(where: {user})`; (2) fallback: batch `balanceOf(user)` over the known pools in one multicall and keep only balances > 0. Do not scan pools one at a time.
- Position amounts (BigInt math): `amount0 = lp * reserve0 / totalSupply`, same for 1. Pool share = `lp * 10000n / totalSupply` basis points. The LP token has 18 decimals; the underlying tokens use their own (USDC = 6).
- **Right after the user's own transaction, read that one pool over RPC.** The subgraph lags a few seconds. Poll or refetch, never show stale numbers.
- If the project has the `arc-dex-subgraph` skill's output, use its queries. If not, use the RPC fallback and say so.

## Rule 4: Swap flow, with a gas buffer for USDC
Gas is paid in USDC from the **same balance** the ERC-20 interface shows.
- **Max button:** when the input token is USDC, max = `balance − GAS_BUFFER`, never the full balance (otherwise the swap or its approve cannot pay for gas). Default buffer `0.05 USDC` (`50_000n` in 6 decimals), or compute it from `estimateGas × maxFeePerGas`. The network's minimum base fee is 20 gwei, so a swap costs a fraction of a cent; the buffer is for safety, so be generous rather than tight. Same buffer when adding liquidity with USDC.
- Read USDC balances with ERC-20 `balanceOf` (6 decimals). Never use the native `getBalance` (18 decimals) in swap math; the two differ by 10^12.
- Order: validate pair exists and reserves > 0 → `getAmountsOut` → compute `amountOutMin` from slippage → check allowance → approve if needed and **wait for the receipt** → swap → wait for the receipt → refetch balances and the pool.
- Show price impact and the 0.3% fee. Default slippage 0.5%, user-editable. Deadline: now + 20 minutes (compute at click time, not at page load).
- Disable the button with a clear reason: no wallet, wrong chain (5042 / 5042002), amount is 0, insufficient balance, no pool, insufficient liquidity.

## Rule 5: Approvals
- Check `allowance(owner, router)` first. If it is below the amount, send `approve(router, amount)` (or max if the user opted in), **wait for the receipt**, re-read the allowance, then continue.
- Adding liquidity needs **two** approvals (token A and B), skipping any that already suffice. Removing liquidity needs the **LP token** approved: the token address is the Pair address.
- Show each step in the UI (Approve A → Approve B → Add), one wallet prompt at a time.
- Reverted transactions on Arc still cost gas, so simulate with `simulateContract` before every write and surface the revert reason.

## Rule 6: Numbers
- Use `bigint` everywhere; `parseUnits(text, decimals)` with **that token's** decimals. Never hardcode 18. Read `decimals()` once per token and cache.
- Add liquidity quote: `amountB = amountA * reserveB / reserveA` (same formula as the Router). Min amounts: `amount * (10000n − slippageBps) / 10000n`.
- Format with `formatUnits` and trim, but keep the raw bigint for every contract call.

## Before you say it is done
1. `grep -rn "ETH\b\|WUSDC\|deposit(\|withdraw(\|msg.value\|value:" src/` shows no ETH-function calls, no wrap/unwrap, no `value` on Router calls. (A plain ERC-20 entry named `WETH` in the token list is fine.)
2. Select the same two tokens in both orders. The UI does not reorder, quotes match in both cases, and add liquidity succeeds both ways.
3. Max with USDC leaves the buffer, and the swap still goes through.
4. `/pools` and "My liquidity" make one request each (subgraph) or one batched multicall, not N calls. Check the network tab.
5. Remove liquidity asks for LP approval first and returns both tokens.
