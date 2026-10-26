import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Swap as SwapEvent, Sync, Transfer } from "../generated/templates/Pair/Pair"
import { LiquidityPosition, Pair, Swap, Token } from "../generated/schema"
import { ADDRESS_ZERO, TWO_BD, USDC_ADDRESS, ZERO_BD, ZERO_BI, toDecimal } from "./helpers"

function adjustPosition(pairId: string, user: Address, delta: BigInt): void {
  let id = pairId + "-" + user.toHexString()
  let position = LiquidityPosition.load(id)
  if (position === null) {
    position = new LiquidityPosition(id)
    position.pair = pairId
    position.user = user
    position.liquidity = ZERO_BI
  }
  position.liquidity = position.liquidity.plus(delta)
  position.save()
}

export function handleSync(event: Sync): void {
  let loaded = Pair.load(event.address.toHexString())
  if (loaded === null) {
    return
  }
  let pair = loaded as Pair
  pair.reserve0 = event.params.reserve0
  pair.reserve1 = event.params.reserve1

  // TVL only for pools with a USDC side: 2 x USDC reserve
  let tvl = ZERO_BD
  if (pair.token0 == USDC_ADDRESS) {
    let t0 = Token.load(pair.token0) as Token
    tvl = toDecimal(pair.reserve0, t0.decimals).times(TWO_BD)
  } else if (pair.token1 == USDC_ADDRESS) {
    let t1 = Token.load(pair.token1) as Token
    tvl = toDecimal(pair.reserve1, t1.decimals).times(TWO_BD)
  }
  pair.tvlUSD = tvl
  pair.save()
}

// LP token transfers: keeps totalSupply and each user's balance.
export function handleTransfer(event: Transfer): void {
  let loaded = Pair.load(event.address.toHexString())
  if (loaded === null) {
    return
  }
  let pair = loaded as Pair
  let value = event.params.value
  if (value.equals(ZERO_BI)) {
    return
  }

  let from = event.params.from.toHexString()
  let to = event.params.to.toHexString()

  // mint: from 0x0. This also covers the locked MINIMUM_LIQUIDITY (0x0 -> 0x0), which stays in supply.
  // burn: to 0x0 from the pair.
  if (from == ADDRESS_ZERO) {
    pair.totalSupply = pair.totalSupply.plus(value)
  } else if (to == ADDRESS_ZERO) {
    pair.totalSupply = pair.totalSupply.minus(value)
  }
  pair.save()

  // balances: skip the zero address and the pair itself (it briefly holds LP during burn)
  if (from != ADDRESS_ZERO && from != pair.id) {
    adjustPosition(pair.id, event.params.from, value.neg())
  }
  if (to != ADDRESS_ZERO && to != pair.id) {
    adjustPosition(pair.id, event.params.to, value)
  }
}

export function handleSwap(event: SwapEvent): void {
  let loaded = Pair.load(event.address.toHexString())
  if (loaded === null) {
    return
  }
  let pair = loaded as Pair

  let amountUSD = ZERO_BD
  if (pair.token0 == USDC_ADDRESS) {
    let t0 = Token.load(pair.token0) as Token
    amountUSD = toDecimal(event.params.amount0In.plus(event.params.amount0Out), t0.decimals)
  } else if (pair.token1 == USDC_ADDRESS) {
    let t1 = Token.load(pair.token1) as Token
    amountUSD = toDecimal(event.params.amount1In.plus(event.params.amount1Out), t1.decimals)
  }

  pair.volumeUSD = pair.volumeUSD.plus(amountUSD)
  pair.txCount = pair.txCount + 1
  pair.save()

  let swap = new Swap(event.transaction.hash.toHexString() + "-" + event.logIndex.toString())
  swap.pair = pair.id
  swap.sender = event.params.sender
  swap.to = event.params.to
  swap.amount0In = event.params.amount0In
  swap.amount1In = event.params.amount1In
  swap.amount0Out = event.params.amount0Out
  swap.amount1Out = event.params.amount1Out
  swap.amountUSD = amountUSD
  swap.blockNumber = event.block.number
  swap.timestamp = event.block.timestamp
  swap.save()
}
