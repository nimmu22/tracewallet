# TraceWallet — updated UI + views counter

The full application is in this folder. Keep `app/`, `components/`, `services/`, `lib/`, `public/`, `package.json`, `package-lock.json`, `tsconfig.json` and `postcss.config.mjs` together.

## Local run

1. Install Node.js 22 or newer.
2. Open a terminal in this folder and run `npm ci`.
3. Copy `.env.example` to `.env.local` and fill only the variables you use.
4. Run `npm run dev`, then open http://localhost:3000.

## Apply to your existing GitHub project

Use the prepared pull request to apply the changes with the correct file moves. If using this ZIP instead, merge its contents into the repository root. Remove the old root `page.tsx`, `layout.tsx`, `globals.css` and `api/` after confirming their replacements are inside `app/`. Keep your existing API credentials in Vercel; do not put them into GitHub.

## Vercel

Framework: Next.js. Root Directory: repository root. Build Command: `npm run build`. Output Directory: default. Node: 22 or newer. Remove old Vinext or static-export build overrides.

## Counter setup

The counter appears in the header and counts every refresh/repeat visit. It needs a Turso database. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel's Production environment and redeploy. For preview deployments, add them to Preview as well. The table is created automatically. Retain existing Turso settings if you already configured them, so your count is preserved. Until configured, the counter reads Unavailable.

No wallet connection is needed. Existing provider coverage and data limitations remain as documented in README.md.

Checks passed: TypeScript and five mocked counter API tests. Next.js production build also passed, including /api/views and all existing wallet/market routes. Browser layout and real database/provider calls require deployment verification.
