# Arc facts for the DEX frontend

Checked against Arc's public docs. Re-verify an address or URL before putting it in production config.

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | `5042` | `5042002` |
| HTTP RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` |
| WebSocket | `wss://rpc.mainnet.arc.io` | `wss://rpc.testnet.arc.io` |
| Explorer | `https://explorer.arc.io` | `https://explorer.testnet.arc.io` |
| Native currency | USDC (18 decimals natively) | USDC (18 decimals natively) |

## USDC: one balance, two interfaces
- **ERC-20 interface:** `0x3600000000000000000000000000000000000000`, **6 decimals**. Use this for transfers, approvals, allowances, balances in the DEX. No wrapper exists, and none is needed.
- **Native interface:** 18 decimals, used for gas and `msg.value`. Same underlying balance.
- ERC-20 `balanceOf` truncates the last 12 decimals of the native value. Never mix the two scales in one calculation (they differ by 10^12).
- Gas is paid in USDC. A swap that spends the user's entire USDC balance leaves nothing for gas, hence the buffer in Rule 4.

## Chain behavior that matters for a V2 fork
- Transactions are final in under a second; one confirmation is enough.
- Minimum base fee is 20 gwei; transactions with `maxFeePerGas` below that are silently dropped. Let viem/wagmi estimate fees, and do not hardcode a low gas price.
- `block.timestamp` never goes backwards but can repeat across blocks. Use block numbers for ordering in the UI and indexer.
- Transfers to or from blocklisted addresses revert, and a revert still costs gas. Simulate first.
- EVM is Ethereum-like (Osaka baseline), `CREATE2` works as on Ethereum. A V2 fork deploys unchanged.
- Native USDC movements emit logs from two emitters (a system emitter and the ERC-20 contract). If you ever read USDC `Transfer` logs, filter by the ERC-20 address to avoid double counting.

## Shared contracts (from Arc's contract-addresses page)
Same address on both networks unless two are shown. Re-verify on the explorer before production.

| Contract | Mainnet (5042) | Testnet (5042002) |
|---|---|---|
| **USDC** (ERC-20 interface, 6 dec) | `0x3600000000000000000000000000000000000000` | same |
| **Multicall3** | `0xcA11bde05977b3631167028862bE2a173976CA11` | same |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | same |
| **CREATE2 factory** (Arachnid) | `0x4e59b44847b379578588920cA78FbF26c0B4956C` | same |
| EURC | `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1` | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |
| USYC | `0x8a5D989Bbb96929F689B0200f435f53dA42bF490` | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` |
| cirBTC (listed under "Wrapped assets") | `0x171A4217b86A807A64eB94757Db6849fb4bDbAA0` | `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF` |
| `WETH` (listed under "Wrapped assets") | `0x128cC466B61f542da60c70e3aA11c10e19B84EDB` | `0x2c4047028a72803939b6fb674D01bC059B5C4961` |
| Multicall3From | `0x522fAf9A91c41c443c66765030741e4AaCe147D0` | same |

**About the `WETH` row:** the docs list it next to cirBTC as a wrapped asset. The page does not say what it wraps, and Arc's gas token is USDC, so treat it as an **ordinary ERC-20** (a token users might pair), **not** as a wrapper of the native coin. Never pass it as the Router's `WETH`, never call `deposit()`/`withdraw()` on it, and read its `name()`, `symbol()` and `decimals()` on-chain before showing it.

Not DEX-relevant (skip): CCTP, Gateway, FxEscrow, Memo, ERC-8004 registries, USYC Teller/Entitlements.

### Default token list for the selector
Seed the selector with USDC, EURC, USYC, cirBTC and the `WETH` token from the table, plus any tokens the user imports by address. Read `decimals()` and `symbol()` on-chain for each; only USDC's 6 decimals is confirmed here.

## Project config to create once (`config.ts`)
```ts
export const USDC = '0x3600000000000000000000000000000000000000' as const
export const CONTRACTS = {
  5042:    { factory: '0x...', router: '0x...' },   // fill from YOUR deployment (not from Arc docs)
  5042002: { factory: '0x...', router: '0x...' },
} as const
```
Never read addresses from the Router (`WETH()` is a placeholder here).

## Multicall
Multicall3 is deployed at `0xcA11bde05977b3631167028862bE2a173976CA11` on both networks. Set it in the viem chain definition (`contracts.multicall3`, shown in `snippets.md`) so `client.multicall` works, and batch pool-list reads with it.
