# Frontend queries (copy as is)

All addresses lowercase. BigInt/BigDecimal come back as **strings**; parse BigInt with `BigInt(x)`.

## 1. All pools (pools page)
```graphql
query Pools($first: Int!, $skip: Int!) {
  pairs(first: $first, skip: $skip, orderBy: tvlUSD, orderDirection: desc) {
    id
    token0 { id symbol name decimals }
    token1 { id symbol name decimals }
    reserve0
    reserve1
    totalSupply
    tvlUSD
    volumeUSD
    txCount
  }
}
```
Use `first: 50`. Page with `skip`. Pools without a USDC side show `tvlUSD = 0` and sort last; show their raw reserves instead of a dollar value.

## 2. One user's liquidity (positions list)
```graphql
query MyPositions($user: Bytes!) {
  liquidityPositions(where: { user: $user, liquidity_gt: "0" }) {
    id
    liquidity
    pair {
      id
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      reserve0
      reserve1
      totalSupply
    }
  }
}
```
Math (BigInt, no floats):
```
amount0 = liquidity * reserve0 / totalSupply
amount1 = liquidity * reserve1 / totalSupply
shareBps = liquidity * 10000n / totalSupply
```
Display tokens in the order the pool stores them, or match the user's selection by address. Never reorder the underlying numbers; match them by address.

## 3. Recent activity for one pool
```graphql
query Swaps($pair: String!) {
  swaps(first: 20, where: { pair: $pair }, orderBy: blockNumber, orderDirection: desc) {
    id sender to amount0In amount1In amount0Out amount1Out amountUSD blockNumber timestamp
  }
}
```

## 4. Is the subgraph caught up?
```graphql
{ _meta { block { number } hasIndexingErrors } }
```
Compare `block.number` with the chain's latest block. If it lags by more than a few blocks after the user's own transaction, read that one pool over RPC.

## Sanity checks after deploy
1. `pairs(first: 5) { id reserve0 reserve1 totalSupply }` returns the test pool with non-zero reserves.
2. `liquidityPositions(where: {user: "<your wallet lowercase>"})` shows your LP balance.
3. Remove all your liquidity: that position's `liquidity` goes to `"0"`, and `totalSupply` keeps the locked 1,000 units.
