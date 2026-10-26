import { PairCreated } from "../generated/Factory/Factory"
import { Factory, Pair } from "../generated/schema"
import { Pair as PairTemplate } from "../generated/templates"
import { ZERO_BD, ZERO_BI, getOrCreateToken } from "./helpers"

export function handlePairCreated(event: PairCreated): void {
  let factoryId = event.address.toHexString()
  let factory = Factory.load(factoryId)
  if (factory === null) {
    factory = new Factory(factoryId)
    factory.pairCount = 0
  }
  factory.pairCount = factory.pairCount + 1
  factory.save()

  let token0 = getOrCreateToken(event.params.token0)
  let token1 = getOrCreateToken(event.params.token1)

  let pair = new Pair(event.params.pair.toHexString())
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.reserve0 = ZERO_BI
  pair.reserve1 = ZERO_BI
  pair.totalSupply = ZERO_BI
  pair.tvlUSD = ZERO_BD
  pair.volumeUSD = ZERO_BD
  pair.txCount = 0
  pair.createdAtBlock = event.block.number
  pair.createdAtTimestamp = event.block.timestamp
  pair.save()

  // start indexing this pair's events
  PairTemplate.create(event.params.pair)
}
