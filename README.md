# CHAINTRACE

A read-only dashboard for public wallet activity across EVM networks and Solana. It combines network history, wallet-paid transaction fees, recent transactions, and current crypto markets on one page. No wallet connection, private key, or seed phrase is needed.

## Running locally

Use Node.js 22.13 or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows, use `Copy-Item .env.example .env.local` instead of `cp` if needed. Open the local URL printed by the server (normally http://localhost:3000).

```sh
npx tsc --noEmit --incremental false
npm run build
```

The application now uses Next.js App Router directly, with React, TypeScript, Tailwind, Framer Motion, Recharts and viem. Routes and page files are in `app/`; shared components and provider services remain in their original folders. The previous repository snapshot had no package manifest and its route files were at the root. This update restores a runnable Next.js project.

## UI update

The dashboard uses a graphite and cyan palette with a logo-only neon-green hero animation. Floating Bitcoin, Ethereum, BNB, TRON, Base and Solana marks have crisp red outlines (#ff334f), sharp mitered corners and a restrained green halo; no boxes, hexagonal housings, coin frames or chain-name labels surround them. Bitcoin splits into Ethereum and Solana routes, which fan out into five additional chain hops. Address routes then combine at two unlabeled relay points and split again toward five destinations. Rounded right-angle trajectories stay invisible; travelling packets reveal the branching topology. Address endpoints are glowing dots rather than tiles. An eight-second timeline coordinates staggered arrivals, comet tails and small impact sparks. In dark mode, logo fills and moving particles use hacker green (#39ff14); paths stay invisible. Dark mode retains the neon-green fills and red edges. Light mode uses deep emerald fills, thinner muted-red edges, crisp unblurred logos, legible addresses and much softer packet glow. Its white/slate surfaces, network badges and intro text use theme-aware contrast. The stored theme applies before first paint to avoid a dark flash when opening in light mode. The intro uses converging points with invisible routes. The animation preview includes a light/dark toggle, Logos/Blocks comparisons and pause/scrub controls. Optional block housings are a preview-only choice; the dashboard defaults to standalone logos. Animated comparison files are `/branching-logos-preview.gif` and `/branching-blocks-preview.gif`. The illustration scales on mobile; reduced-motion settings retain static logos and address points and hide particles, dust and impact effects. It is decorative and does not add Bitcoin/TRON scanning or a live bridge feature. Open `/animation-preview.html` for the actual SVG animation; `/flow-preview.gif` is a rendered design preview. Wallet tracking, provider coverage, charts, pagination, market refresh, themes and counter behaviour are preserved.


The top bar shows **Total views** from a shared Turso database. It counts every full page load or refresh, including repeat visits by the same person. It does not represent unique visitors or online users. One document load reuses its request across React Strict Mode mounts. No browser fingerprint or wallet address is stored by the counter. Database increments are atomic and retain the existing `tracewallet_page_views` table. Missing configuration or a provider failure displays Unavailable instead of a fabricated count.

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel environment settings, then redeploy. The route creates its single-row table if needed. Keep credentials server-only. If a previous deployment already used these variables, retain them to preserve its count. The legacy Cloudflare `db/` files are unused by this Vercel counter.

Validation:

```sh
npm run typecheck
npm run test:counter
npm run test:providers
npm run build
```

Ten provider tests cover authenticated and public fallback paths, HTTP and JSON rate limits, accurate empty history, malformed responses, and interrupted pagination. They use fixtures; live unauthenticated Ethereum and Avalanche adapters were also checked.

The five counter tests verify origin rejection, missing configuration, atomic increment response, query failure and invalid response handling. They mock storage; a production total still needs configured Turso credentials. Visual browser QA and live provider/counter checks must be completed in an environment with browser access.

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
| Ethereum | Blockscout → Etherscan (if configured) → Routescan | Public fallback; optional provider keys |
| Base | Blockscout PRO → public instance → Etherscan | BLOCKSCOUT_API_KEY or ETHERSCAN_API_KEY with chain access when public access is blocked |
| Arbitrum | Blockscout PRO → public instance → Etherscan | Same as Base |
| Optimism | Blockscout PRO → public instance → Etherscan | Same as Base |
| Polygon | Blockscout PRO → public instance → Etherscan | Same as Base |
| BNB Chain | Etherscan V2, chain 56 | ETHERSCAN_API_KEY with BNB history access |
| Avalanche C-chain | Etherscan V2 (if configured) → Routescan | Public Routescan works without a key |
| Solana | Public Solana JSON-RPC | Optional dedicated RPC recommended |

A valid EVM address scans seven EVM networks. Solana scans only Solana. Each chain attempts its supported providers independently. Public Blockscout instances can return HTTP 403; anonymous access is not guaranteed. Configure server-only keys in Vercel and redeploy to unlock authenticated history. Blockscout PRO access to Base requires an appropriate paid plan. Etherscan chain access also depends on the plan; do not assume a free key unlocks every chain. Routescan currently indexes Ethereum and Avalanche but not Base, Arbitrum, Polygon or BNB.

Failed network cards retain explorer access and have a Retry button that reloads only that network. A verified empty history displays zero and “No normal activity”; a blocked or malformed response is never converted to zero. Provider fallbacks preserve available data and disclose missing fee coverage.

### Environment variables

All credentials stay in server routes. Never prefix them with `NEXT_PUBLIC_`, `VITE_`, or commit `.env.local`.

| Variable | Purpose |
| --- | --- |
| `COINGECKO_API_KEY` | Optional CoinGecko **Demo** key. The Pro endpoint is not configured. |
| `BLOCKSCOUT_API_KEY` | Optional Blockscout PRO key for Ethereum, Base, Arbitrum, Optimism and Polygon. Chain/plan access required. |
| `ETHERSCAN_API_KEY` | Etherscan V2 history/fallback for all EVM networks; chain access depends on plan. Required for BNB. |
| `ROUTESCAN_API_KEY` | Optional Routescan key to increase limits for Ethereum/Avalanche. Sent server-side in an HTTP header. |
| `ETHEREUM_RPC_URL` | Optional Ethereum mainnet RPC for ENS. Public endpoints are used by default. |
| `SOLANA_RPC_URL` | Optional Solana RPC. Defaults to api.mainnet-beta.solana.com. |
| `TURSO_DATABASE_URL` | Shared page-view database URL (`libsql://...` or `https://...`). |
| `TURSO_AUTH_TOKEN` | Server-only token for the page-view database. |

Public Blockscout requests work only while the instance permits anonymous access. If CoinGecko is blocked or throttled, current market data falls back to CoinPaprika and the footer changes attribution. Both sources rank the market dynamically. The native asset ID map only supports fee conversion; it does not define the top ten. The fallback uses symbol monograms when a provider supplies no logo URL.

## Accuracy and coverage

> Wallet age is calculated from the oldest transaction available from the configured provider. It should be treated as “first seen on-chain,” not the actual date the private key was created.

EVM providers load at most three pages (usually 150 normal transactions) per chain. If pagination remains, totals show a `+`, the UI says “Transactions loaded,” and gas and chart summaries explicitly cover that sample. An ascending query obtains the first normal transaction separately. When that query fails, first activity stays unavailable unless the whole returned history was loaded.

“Complete” means the provider exhausted **normal transaction** history. It does not imply all possible wallet interactions are covered. Internal calls, separate token transfer events, NFT activity, account abstraction reimbursements, and off-chain activity are excluded. Activity shares and “most active” compare the loaded sample, which can favor chains whose latest sample is denser. Networks that fail are never counted as unused.

Fees count transactions sent by the wallet, including failed transactions. Incoming transaction fees are not charged to the recipient. The table displays the transaction's fee paid by its sender. Blockscout supplies the actual fee; the Etherscan/Routescan fallback calculates `gasUsed * gasPrice` where it represents total fees. Base and Optimism txlist responses omit L1 data fees, so their fallback total fees remain unknown rather than understating costs. Use Blockscout with actual fee data for full loaded fee totals. Native values are rounded for display. Different native tokens are kept separate and never added as if they were the same asset.

USD values use current quotes and are labeled **Estimated using current token price**. They are not historical costs. Unpriced networks are excluded from the priced subtotal. A retained market result is labeled as last-known data if a refresh fails. Quote timestamps and provider freshness can lag the refresh time.

Solana loads up to 100 finalized signatures and attempts details for ten transactions. Anonymous RPC limits and retention vary. Solana lifetime gas and first activity stay unavailable because this bounded read cannot prove complete coverage. A single parsed native transfer can expose from/to/value; complex transactions keep those fields unavailable rather than guessing. Instruction compute units are not added to EVM gas units.

## Architecture

- `app/page.tsx`: dashboard composition, scan lifecycle, and user interactions.
- `components/chaintrace/`: isolated clock, intro, and lazy-loaded chart components.
- `services/types.ts`: network registry and normalized provider contract.
- `services/evm.ts`: Blockscout/Blockscout PRO/Etherscan/Routescan fallbacks, normalization and wallet-paid fee aggregation.
- `services/{ethereum,base,arbitrum,optimism,polygon,bnb,avalanche}.ts`: named EVM adapter entry points.
- `services/solana.ts`: signature history and parsed RPC details.
- `services/ens.ts`: resolution and forward-verified reverse lookup.
- `services/prices.ts`: current quotes and provider fallback.
- `services/http.ts`: bounded caching, in-flight reuse, request budget, and timeouts.
- `app/api/{wallet,resolve,market}/route.ts`: server-only provider access.

Wallet responses cache for two minutes and markets for one minute. Caches and the request budget are per Worker isolate, not a global abuse-prevention service. A public high-traffic deployment should add a shared rate limiter or platform firewall and dedicated provider plans. Individual requests time out after ten seconds. Transient HTTP 429/5xx or network timeouts retry once; HTTP 403 immediately advances to a different provider. EVM provider work has a shared 45-second deadline and the wallet route allows 60 seconds. A scan can take longer than one request because pages are fetched in sequence. Market requests pause when the tab is hidden. Address validation is debounced, but network lookup requires explicit submission.

The optional WebMCP tool `analyze_public_wallet` reuses the same scan handler. It feature-detects browser support, validates inputs, and unregisters on unmount.

## Adding a network

Add an entry in `services/types.ts`, a provider adapter returning `ChainStats`, and register it in `services/index.ts`. Reuse `getEvmStats` for compatible Blockscout/Etherscan networks; otherwise normalize responses in a dedicated service. Supply a native token price ID and correct explorer URL. Preserve unknown values as `null` and declare whether returned history is partial. Never use an account nonce as a total transaction count.

## Deploying on Vercel

Import the repository with the Next.js preset. Use the repository root as Root Directory, `npm run build` as Build Command, and leave Output Directory at its default. Use Node 22 or newer. API routes need a server; do not enable static export. Configure provider and counter variables from `.env.example`, then deploy.

Production deployment is not verified by the local build. Check wallet scans, market requests and the counter after deployment. Existing `scripts/` helpers from the older Sites setup are retained for history; the current package scripts use Next.js directly.

## Provider references

- [Blockscout API schema](https://github.com/blockscout/blockscout-api-v2-swagger)
- [CoinGecko markets](https://docs.coingecko.com/reference/coins-markets)
- [CoinPaprika developer API](https://coinpaprika.com/api/developers/)
- [Solana signatures](https://solana.com/docs/rpc/http/getsignaturesforaddress)
- [Etherscan V2](https://docs.etherscan.io/)
- [Blockscout PRO Base access](https://docs.blockscout.com/base-api)
- [Routescan supported chains](https://routescan.io/docs/getting-started/supported-chains)
- [Routescan keyless limits](https://routescan.io/docs/plans-and-limits/api-keys-and-pricing)

