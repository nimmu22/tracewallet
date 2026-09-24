[README.md](https://github.com/user-attachments/files/32593190/README.md)
# CHAINTRACE

A read-only dashboard for public wallet activity across EVM networks and Solana. It combines network history, wallet-paid transaction fees, recent transactions, and current crypto markets on one page. No wallet connection, private key, or seed phrase is needed.

## Running locally

Use Node.js 22.13 or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows, use `Copy-Item .env.example .env.local` instead of `cp` if needed. Open the local URL printed by the server (normally http://localhost:5173).

```sh
npx tsc --noEmit --incremental false
npm run build
```

The default build uses Vinext, a Vite implementation of the Next.js App Router, to emit a Cloudflare-compatible Worker and client assets. React 19, TypeScript, Tailwind 4, Framer Motion, Recharts, viem, and the starter's accessible Radix primitives power the interface. Charts are lazy-loaded. The clock updates independently of the dashboard.

## What works

- Public EVM addresses, EIP-55 checksums, Solana public keys, and `.eth` resolution.
- Independent network scanning, inline validation, and partial results when a provider fails.
- First observed activity, wallet age, loaded transaction counts, network shares, and recent activity.
- Wallet-paid gas totals grouped by native asset, USD estimates, a network cost chart, and highest/average priced fees in loaded history.
- Date-range chart controls, network filters, transaction pagination, copy, and explorer links.
- A dynamic top-10 market table, refreshed every 60 seconds while the page is visible.
- Dark and light themes saved on this device, mobile transaction cards, and reduced-motion support.
- A short opening animation shown once per browser session.

## Networks and providers

| Network | Provider | Configuration |
| --- | --- | --- |
| Ethereum | eth.blockscout.com | Anonymous |
| Base | base.blockscout.com | Anonymous |
| Arbitrum | arbitrum.blockscout.com | Anonymous |
| Optimism | optimism.blockscout.com | Anonymous |
| Polygon | polygon.blockscout.com | Anonymous |
| BNB Chain | Etherscan V2, chain 56 | API key with access to the chain |
| Avalanche C-chain | Etherscan V2, chain 43114 | API key with access to the chain |
| Solana | Public Solana JSON-RPC | Optional dedicated RPC recommended |

A valid EVM address scans the seven EVM networks. Solana scans only Solana. A network requiring credentials is shown as unavailable until configured. Etherscan free-tier support varies by network; the app does not claim that one free key unlocks every chain.

### Environment variables

All credentials stay in server routes. Never prefix them with `NEXT_PUBLIC_`, `VITE_`, or commit `.env.local`.

| Variable | Purpose |
| --- | --- |
| `COINGECKO_API_KEY` | Optional CoinGecko **Demo** key. The Pro endpoint is not configured. |
| `ETHERSCAN_API_KEY` | Etherscan V2 history for BNB and Avalanche; chain access depends on plan. |
| `ETHEREUM_RPC_URL` | Optional Ethereum mainnet RPC for ENS. Public endpoints are used by default. |
| `SOLANA_RPC_URL` | Optional Solana RPC. Defaults to api.mainnet-beta.solana.com. |

No keys are required for the five Blockscout integrations. If CoinGecko is blocked or throttled, current market data falls back to CoinPaprika and the footer changes attribution. Both sources rank the market dynamically. The native asset ID map only supports fee conversion; it does not define the top ten. The fallback uses symbol monograms when a provider supplies no logo URL.

## Accuracy and coverage

> Wallet age is calculated from the oldest transaction available from the configured provider. It should be treated as “first seen on-chain,” not the actual date the private key was created.

EVM providers load at most three pages (usually 150 normal transactions) per chain. If pagination remains, totals show a `+`, the UI says “Transactions loaded,” and gas and chart summaries explicitly cover that sample. An ascending query obtains the first normal transaction separately. When that query fails, first activity stays unavailable unless the whole returned history was loaded.

“Complete” means the provider exhausted **normal transaction** history. It does not imply all possible wallet interactions are covered. Internal calls, separate token transfer events, NFT activity, account abstraction reimbursements, and off-chain activity are excluded. Activity shares and “most active” compare the loaded sample, which can favor chains whose latest sample is denser. Networks that fail are never counted as unused.

Fees count transactions sent by the wallet, including failed transactions. Incoming transaction fees are not charged to the recipient. The table displays the transaction's fee paid by its sender. Blockscout supplies the actual fee; the Etherscan fallback calculates `gasUsed * gasPrice` for BNB/Avalanche. Native values are rounded for display. Different native tokens are kept separate and never added as if they were the same asset.

USD values use current quotes and are labeled **Estimated using current token price**. They are not historical costs. Unpriced networks are excluded from the priced subtotal. A retained market result is labeled as last-known data if a refresh fails. Quote timestamps and provider freshness can lag the refresh time.

Solana loads up to 100 finalized signatures and attempts details for ten transactions. Anonymous RPC limits and retention vary. Solana lifetime gas and first activity stay unavailable because this bounded read cannot prove complete coverage. A single parsed native transfer can expose from/to/value; complex transactions keep those fields unavailable rather than guessing. Instruction compute units are not added to EVM gas units.

## Architecture

- `app/page.tsx`: dashboard composition, scan lifecycle, and user interactions.
- `components/chaintrace/`: isolated clock, intro, and lazy-loaded chart components.
- `services/types.ts`: network registry and normalized provider contract.
- `services/evm.ts`: Blockscout/Etherscan normalization and wallet-paid fee aggregation.
- `services/{ethereum,base,arbitrum,optimism,polygon,bnb,avalanche}.ts`: named EVM adapter entry points.
- `services/solana.ts`: signature history and parsed RPC details.
- `services/ens.ts`: resolution and forward-verified reverse lookup.
- `services/prices.ts`: current quotes and provider fallback.
- `services/http.ts`: bounded caching, in-flight reuse, request budget, and timeouts.
- `app/api/{wallet,resolve,market}/route.ts`: server-only provider access.

Wallet responses cache for two minutes and markets for one minute. Caches and the request budget are per Worker isolate, not a global abuse-prevention service. A public high-traffic deployment should add a shared rate limiter or platform firewall and dedicated provider plans. Requests time out after ten seconds; a scan can take longer because pages are fetched in sequence. Market requests pause when the tab is hidden. Address validation is debounced, but network lookup requires explicit submission.

The optional WebMCP tool `analyze_public_wallet` reuses the same scan handler. It feature-detects browser support, validates inputs, and unregisters on unmount.

## Adding a network

Add an entry in `services/types.ts`, a provider adapter returning `ChainStats`, and register it in `services/index.ts`. Reuse `getEvmStats` for compatible Blockscout/Etherscan networks; otherwise normalize responses in a dedicated service. Supply a native token price ID and correct explorer URL. Preserve unknown values as `null` and declare whether returned history is partial. Never use an account nonce as a total transaction count.

## Checks

```sh
npx tsc --noEmit --incremental false
npm test
npm run build
```

The accuracy checks cover address formats, duplicate hashes, incoming versus wallet-paid fees, reverted transactions, and incomplete-history first-activity behavior. Live provider access remains subject to upstream limits; deterministic tests do not assert current balances or prices.

## Deploying on Vercel

The product uses portable Next.js App Router APIs. The included deployment configuration targets Sites/Cloudflare, while Vercel should use the installed Next.js runtime directly:

1. Import the repository into Vercel and choose the Next.js framework preset.
2. Override the build command to `npx next build` and use the default Next.js output directory.
3. Add the server environment variables above in Vercel project settings.
4. Select a supported Node 22 runtime and deploy. Do not use a static export: API routes need a server.

The Vite/Cloudflare build files are not used by `next build`. The existing `.openai/hosting.json` is Sites metadata and is not required by Vercel. Vercel deployment has not been exercised as part of the Sites build; verify provider access in that environment before making it public.

## Provider references

- [Blockscout API schema](https://github.com/blockscout/blockscout-api-v2-swagger)
- [CoinGecko markets](https://docs.coingecko.com/reference/coins-markets)
- [CoinPaprika developer API](https://coinpaprika.com/api/developers/)
- [Solana signatures](https://solana.com/docs/rpc/http/getsignaturesforaddress)
- [Etherscan V2](https://docs.etherscan.io/)

