# Snippets (viem, TypeScript). Adapt to wagmi hooks or ethers if the project uses them.

## Chain definitions
```ts
import { defineChain } from 'viem'

export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'], webSocket: ['wss://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
  contracts: { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
})

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'], webSocket: ['wss://rpc.testnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Testnet Explorer', url: 'https://explorer.testnet.arc.io' } },
  contracts: { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
  testnet: true,
})
```

## ABIs. Deliberately no ETH functions.
```ts
import { parseAbi, erc20Abi } from 'viem'
export { erc20Abi }

export const routerAbi = parseAbi([
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)',
  'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
])

export const factoryAbi = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address pair)',
])

export const pairAbi = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
])
```

## Ordering helpers
```ts
import { type Address, getAddress, zeroAddress } from 'viem'

export const isBefore = (a: Address, b: Address) => a.toLowerCase() < b.toLowerCase()
export const sameAddr = (a: Address, b: Address) => a.toLowerCase() === b.toLowerCase()

// Use ONLY when encoding the contract call. Never store the result in UI state.
export function toRouterOrder(tokenA: Address, tokenB: Address, amountA: bigint, amountB: bigint, minA: bigint, minB: bigint) {
  return isBefore(tokenA, tokenB)
    ? { token0: tokenA, token1: tokenB, amount0: amountA, amount1: amountB, min0: minA, min1: minB }
    : { token0: tokenB, token1: tokenA, amount0: amountB, amount1: amountA, min0: minB, min1: minA }
}
```

## Read one pool, oriented to the user's tokens (UI order is untouched)
```ts
export async function readPool(client: PublicClient, factory: Address, tokenA: Address, tokenB: Address) {
  const pair = await client.readContract({ address: factory, abi: factoryAbi, functionName: 'getPair', args: [tokenA, tokenB] })
  if (pair === zeroAddress) return null // no pool yet: the user sets the first price

  const [token0, [r0, r1], totalSupply] = await Promise.all([
    client.readContract({ address: pair, abi: pairAbi, functionName: 'token0' }),
    client.readContract({ address: pair, abi: pairAbi, functionName: 'getReserves' }),
    client.readContract({ address: pair, abi: pairAbi, functionName: 'totalSupply' }),
  ])
  const aIsToken0 = sameAddr(tokenA, token0)
  return {
    pair,
    totalSupply,
    reserveA: aIsToken0 ? r0 : r1, // reserve of the user's token A
    reserveB: aIsToken0 ? r1 : r0,
  }
}
```

## Add liquidity
```ts
const BPS = 10_000n
const withSlippage = (x: bigint, bps: bigint) => (x * (BPS - bps)) / BPS
const quoteB = (amountA: bigint, reserveA: bigint, reserveB: bigint) => (amountA * reserveB) / reserveA

// Existing pool: user types A, show B = quoteB(A, reserveA, reserveB). New pool: both inputs are free.
async function addLiquidity({ wallet, client, router, tokenA, tokenB, amountA, amountB, slippageBps = 50n, account }: Args) {
  await ensureAllowance(wallet, client, tokenA, account, router, amountA)
  await ensureAllowance(wallet, client, tokenB, account, router, amountB)

  const o = toRouterOrder(tokenA, tokenB, amountA, amountB, withSlippage(amountA, slippageBps), withSlippage(amountB, slippageBps))
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)

  const { request } = await client.simulateContract({
    account, address: router, abi: routerAbi, functionName: 'addLiquidity',
    args: [o.token0, o.token1, o.amount0, o.amount1, o.min0, o.min1, account, deadline],
    // no `value`: Arc has no ETH-style wrapping
  })
  const hash = await wallet.writeContract(request)
  return client.waitForTransactionReceipt({ hash })
}
```
For a brand-new pool, set both min amounts to the full amounts times `(1 - slippage)`; there is no ratio to protect.

## Remove liquidity
```ts
async function removeLiquidity({ wallet, client, router, pair, tokenA, tokenB, lp, expectedA, expectedB, slippageBps = 50n, account }: Args) {
  await ensureAllowance(wallet, client, pair /* LP token = the Pair */, account, router, lp)
  const o = toRouterOrder(tokenA, tokenB, expectedA, expectedB, withSlippage(expectedA, slippageBps), withSlippage(expectedB, slippageBps))
  // for removeLiquidity pass o.token0/o.token1 and the matching min0/min1
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)
  const { request } = await client.simulateContract({
    account, address: router, abi: routerAbi, functionName: 'removeLiquidity',
    args: [o.token0, o.token1, lp, o.min0, o.min1, account, deadline],
  })
  const hash = await wallet.writeContract(request)
  return client.waitForTransactionReceipt({ hash })
}
// expectedA = lp * reserveA / totalSupply  (same for B)
```

## Approvals
```ts
async function ensureAllowance(wallet, client, token: Address, owner: Address, spender: Address, amount: bigint) {
  const current = await client.readContract({ address: token, abi: erc20Abi, functionName: 'allowance', args: [owner, spender] })
  if (current >= amount) return
  const { request } = await client.simulateContract({ account: owner, address: token, abi: erc20Abi, functionName: 'approve', args: [spender, amount] })
  const hash = await wallet.writeContract(request)
  await client.waitForTransactionReceipt({ hash })
  const after = await client.readContract({ address: token, abi: erc20Abi, functionName: 'allowance', args: [owner, spender] })
  if (after < amount) throw new Error('Approval did not go through')
}
```

## Swap, with price impact and the USDC gas buffer
```ts
export const USDC = '0x3600000000000000000000000000000000000000' as const
export const GAS_BUFFER_USDC = 50_000n // 0.05 USDC in 6 decimals; raise it if txs start failing

export function maxSpendable(token: Address, balance: bigint) {
  if (!sameAddr(token, USDC)) return balance
  return balance > GAS_BUFFER_USDC ? balance - GAS_BUFFER_USDC : 0n
}

export async function quoteSwap(client: PublicClient, router: Address, tokenIn: Address, tokenOut: Address, amountIn: bigint, reserveIn: bigint, reserveOut: bigint, slippageBps = 50n) {
  const amounts = await client.readContract({ address: router, abi: routerAbi, functionName: 'getAmountsOut', args: [amountIn, [tokenIn, tokenOut]] })
  const out = amounts[amounts.length - 1]
  const spotOut = (amountIn * reserveOut) / reserveIn          // price before the trade, no fee
  const impactBps = spotOut > 0n ? ((spotOut - out) * 10_000n) / spotOut : 0n // includes the 0.3% fee
  return { out, minOut: withSlippage(out, slippageBps), impactBps }
}

async function swap({ wallet, client, router, tokenIn, tokenOut, amountIn, minOut, account }: Args) {
  await ensureAllowance(wallet, client, tokenIn, account, router, amountIn)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)
  const { request } = await client.simulateContract({
    account, address: router, abi: routerAbi, functionName: 'swapExactTokensForTokens',
    args: [amountIn, minOut, [tokenIn, tokenOut], account, deadline],
  })
  const hash = await wallet.writeContract(request)
  return client.waitForTransactionReceipt({ hash })
}
```
Read the user's USDC balance with `erc20Abi.balanceOf` on `USDC` (6 decimals), never with `getBalance` (18 decimals).

## Pools page and my positions, RPC fallback (only when the subgraph is unavailable)
```ts
// all pools: 1 call for the count, then ONE batched multicall per page, never a render-time loop
const n = Number(await client.readContract({ address: factory, abi: factoryAbi, functionName: 'allPairsLength' }))
const ids = Array.from({ length: Math.min(n, 50) }, (_, i) => i)
const pairs = await client.multicall({ allowFailure: false,
  contracts: ids.map(i => ({ address: factory, abi: factoryAbi, functionName: 'allPairs', args: [BigInt(i)] })) })
const state = await client.multicall({ allowFailure: false, contracts: pairs.flatMap(p => [
  { address: p, abi: pairAbi, functionName: 'token0' },
  { address: p, abi: pairAbi, functionName: 'token1' },
  { address: p, abi: pairAbi, functionName: 'getReserves' },
  { address: p, abi: pairAbi, functionName: 'totalSupply' },
]) })
// my positions: one multicall of balanceOf(user) over `pairs`, keep balances > 0
```
`multicall` works because Multicall3 is set in the chain definitions above (`0xcA11…CA11` on both networks).

## Subgraph client (when available)
Use the queries from the `arc-dex-subgraph` skill (`references/queries.md`): `pairs(orderBy: tvlUSD)` for `/pools`, `liquidityPositions(where: {user, liquidity_gt: "0"})` for "My liquidity". Lowercase the user address. Poll `_meta.block.number` if you need freshness.
