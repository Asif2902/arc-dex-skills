import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { ERC20 } from "../generated/Factory/ERC20"
import { Token } from "../generated/schema"

export const ZERO_BI = BigInt.fromI32(0)
export const ZERO_BD = BigDecimal.fromString("0")
export const TWO_BD = BigDecimal.fromString("2")
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

// Arc USDC ERC-20 interface (6 decimals). Lowercase. Change if deploying on another chain.
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1")
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString("10"))
  }
  return bd
}

export function toDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function getOrCreateToken(address: Address): Token {
  let id = address.toHexString()
  let token = Token.load(id)
  if (token === null) {
    token = new Token(id)
    let erc20 = ERC20.bind(address)
    let symbol = erc20.try_symbol()
    let name = erc20.try_name()
    let decimals = erc20.try_decimals()
    token.symbol = symbol.reverted ? "UNKNOWN" : symbol.value
    token.name = name.reverted ? "Unknown token" : name.value
    token.decimals = decimals.reverted ? 18 : decimals.value
    token.save()
  }
  return token as Token
}
