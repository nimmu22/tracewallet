/** EVM normal transactions and wallet-paid fees. Token transfers and internal calls are excluded. */
import { fetchJSON, isoSeconds, native, cached } from "./http";
import type { Network, ChainStats, WalletTransaction } from "./types";
interface BlockTx {
  hash: string;
  timestamp: string | null;
  from?: { hash: string };
  to?: { hash: string };
  value: string;
  fee?: { value: string; type: string };
  gas_used?: string;
  method?: string;
  status?: string;
  result?: string;
}
interface LegacyTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  isError: string;
  functionName?: string;
}
const normalHash = /^0x[0-9a-f]{64}$/i;
function normalize(
  t: BlockTx,
  chain: Network,
  address: string,
): WalletTransaction {
  const paid = t.from?.hash.toLowerCase() === address.toLowerCase();
  return {
    hash: t.hash,
    chain: chain.id,
    timestamp:
      t.timestamp && Number.isFinite(Date.parse(t.timestamp))
        ? t.timestamp
        : null,
    from: t.from?.hash ?? null,
    to: t.to?.hash ?? null,
    value: native(t.value),
    fee: t.fee?.type === "actual" ? native(t.fee.value) : null,
    gasUsed: t.gas_used ? Number(t.gas_used) : null,
    paidByWallet: paid,
    type: t.method || (!t.to ? "Deploy" : paid ? "Send" : "Receive"),
    status:
      t.status === "ok"
        ? "success"
        : t.status === "error"
          ? "failed"
          : "unknown",
  };
}
export function summarize(
  chain: Network,
  txs: WalletTransaction[],
  complete: boolean,
  first: string | null,
  provider: string,
  note: string,
): ChainStats {
  const sorted = [...new Map(txs.map((t) => [t.hash, t])).values()].sort(
    (a, b) =>
      (Date.parse(b.timestamp ?? "") || 0) -
      (Date.parse(a.timestamp ?? "") || 0),
  );
  const paid = sorted.filter((t) => t.paidByWallet);
  // Sum only fees paid by this wallet, including reverted transactions. Incoming transfers cost the sender.
  const feeKnown = paid.every((t) => t.fee !== null);
  return {
    chain: chain.id,
    transactionCount: sorted.length,
    complete,
    firstActivity:
      first ?? (complete ? (sorted.at(-1)?.timestamp ?? null) : null),
    lastActivity: sorted[0]?.timestamp ?? null,
    gasSpentNative: feeKnown ? paid.reduce((s, t) => s + t.fee!, 0) : null,
    gasUsed: paid.every((t) => t.gasUsed !== null)
      ? paid.reduce((s, t) => s + t.gasUsed!, 0)
      : null,
    feeTransactionCount: paid.length,
    latestTransactions: sorted,
    provider,
    note,
    fetchedAt: new Date().toISOString(),
  };
}
async function blockscout(
  chain: Network,
  address: string,
  pro = false,
  signal?: AbortSignal,
): Promise<ChainStats> {
  const base = pro ? `https://api.blockscout.com/${chain.chainId}` : chain.api!;
  const auth: Record<string, string> = pro ? { apikey: process.env.BLOCKSCOUT_API_KEY! } : {};
  let txs: WalletTransaction[] = [];
  let cursor: Record<string, string> | null = null;
  let complete = false;
  let interrupted = false;
  // Bound pagination to keep anonymous API use predictable. Coverage remains visible in every aggregate.
  for (let page = 0; page < 3; page++) {
    try {
      const query = "?" + new URLSearchParams({ ...cursor, ...auth });
      const data: {
        items: BlockTx[];
        next_page_params: Record<string, string> | null;
      } = await fetchJSON<{
        items: BlockTx[];
        next_page_params: Record<string, string> | null;
      }>(`${base}/api/v2/addresses/${address}/transactions${query}`, { signal });
      if (!Array.isArray(data.items) || data.items.some(t => !t || !normalHash.test(t.hash)))
        throw new Error("Unexpected provider response.");
      txs.push(
        ...data.items.map((t) => normalize(t, chain, address)),
      );
      cursor = data.next_page_params;
      if (!cursor) {
        complete = true;
        break;
      }
    } catch (e) {
      if (page === 0) throw e;
      interrupted = true;
      break;
    }
  }
  let first: string | null = null;
  if (!complete) {
    try {
      const old = await fetchJSON<{ result: LegacyTx[] }>(
        `${base}/api?` + new URLSearchParams({ module: "account", action: "txlist", address, page: "1", offset: "1", sort: "asc", ...auth }),
        { signal },
      );
      if (Array.isArray(old.result) && old.result[0])
        first = isoSeconds(old.result[0].timeStamp);
    } catch {
      /* First activity stays unavailable rather than treating the oldest sampled row as wallet creation. */
    }
  }
  return summarize(
    chain,
    txs,
    complete,
    first,
    pro ? "Blockscout PRO" : "Blockscout",
    complete
      ? "All normal transactions returned by this provider."
      : `${interrupted ? "Provider interrupted pagination. " : ""}Latest ${txs.length} normal transactions loaded; gas and charts cover this sample.`,
  );
}
interface LegacyResponse {
  status: string;
  message: string;
  result: LegacyTx[] | string | null;
}
function transactionRows(data: LegacyResponse): LegacyTx[] {
  if (data.status === "0" && /no transactions found/i.test(data.message) && Array.isArray(data.result) && data.result.length === 0) return [];
  if (data.status !== "1" || !Array.isArray(data.result))
    throw new Error("History provider could not serve this network. Check API key and chain access.");
  // Reject malformed successful responses rather than converting them into an unused wallet.
  if (data.result.some(t => !t || !normalHash.test(t.hash) || typeof t.from !== "string" || typeof t.to !== "string"))
    throw new Error("History provider returned invalid transactions.");
  return data.result;
}
// Pace calls in each process so a parallel seven-network scan does not burst past free API limits.
const nextCall = new Map<string, number>();
async function legacyRows(url: string, init: RequestInit, routescan: boolean): Promise<LegacyTx[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const provider = routescan ? "routescan" : "etherscan";
    const now = Date.now();
    const at = Math.max(now, nextCall.get(provider) ?? now);
    nextCall.set(provider, at + (routescan ? 550 : 250));
    if (at > now) await new Promise(resolve => setTimeout(resolve, at - now));
    init.signal?.throwIfAborted();
    const data = await fetchJSON<LegacyResponse>(url, init);
    if (attempt === 0 && data.status === "0" && /rate limit|timeout|server too busy/i.test(`${data.message} ${typeof data.result === "string" ? data.result : ""}`)) {
      await new Promise(resolve => setTimeout(resolve, 750));
      continue;
    }
    return transactionRows(data);
  }
  throw new Error("History provider is temporarily busy.");
}
async function legacyHistory(chain: Network, address: string, routescan = false, signal?: AbortSignal): Promise<ChainStats> {
  const url = new URL(routescan
    ? `https://api.routescan.io/v2/network/mainnet/evm/${chain.chainId}/etherscan/api`
    : "https://api.etherscan.io/v2/api");
  const key = routescan ? process.env.ROUTESCAN_API_KEY : process.env.ETHERSCAN_API_KEY;
  url.search = new URLSearchParams({
    ...(routescan ? {} : { chainid: String(chain.chainId), apikey: key! }),
    module: "account", action: "txlist", address, page: "1", offset: "150", sort: "desc",
  }).toString();
  const init: RequestInit = { signal, ...(routescan && key ? { headers: { apikey: key } } : {}) };
  const data = { result: await legacyRows(url.toString(), init, routescan) };
  const complete = data.result.length < 150;
  const txs = data.result
    .filter((t) => normalHash.test(t.hash))
    .map((t) => {
      let raw: string | undefined;
      try {
        raw = (BigInt(t.gasUsed) * BigInt(t.gasPrice)).toString();
      } catch {}
      return {
        hash: t.hash,
        chain: chain.id,
        timestamp: isoSeconds(t.timeStamp),
        from: t.from,
        to: t.to || null,
        value: native(t.value),
        // Base/Optimism txlist omits L1 data fees. Do not present execution-only fees as total gas.
        fee: raw && chain.id !== "base" && chain.id !== "optimism" ? native(raw) : null,
        gasUsed: /^\d+$/.test(t.gasUsed) ? Number(t.gasUsed) : null,
        paidByWallet: t.from.toLowerCase() === address.toLowerCase(),
        type:
          t.functionName?.split("(")[0] ||
          (t.from.toLowerCase() === address.toLowerCase() ? "Send" : "Receive"),
        status: t.isError === "1" ? "failed" : "success",
      } as WalletTransaction;
    });
  let first: string | null = null;
  if (!complete) {
    url.searchParams.set("sort", "asc");
    url.searchParams.set("offset", "1");
    try {
      const old = await legacyRows(url.toString(), init, routescan);
      first = isoSeconds(old[0]?.timeStamp);
    } catch {}
  }
  return summarize(
    chain,
    txs,
    complete,
    first,
    routescan ? "Routescan" : "Etherscan V2",
    (complete
      ? "All normal transactions returned by provider."
      : "Latest 150 normal transactions; fees and charts cover this sample.") +
      (chain.id === "base" || chain.id === "optimism" ? " Total gas fees need a provider with L1 fee data." : ""),
  );
}
export const getEvmStats = (chain: Network, address: string) =>
  cached(`${chain.id}:${address.toLowerCase()}`, 120000, async () => {
    const loaders: (() => Promise<ChainStats>)[] = [];
    const signal = AbortSignal.timeout(45000);
    if (chain.api) {
      if (process.env.BLOCKSCOUT_API_KEY) loaders.push(() => blockscout(chain, address, true, signal));
      loaders.push(() => blockscout(chain, address, false, signal));
    }
    if (process.env.ETHERSCAN_API_KEY) loaders.push(() => legacyHistory(chain, address, false, signal));
    // Routescan currently indexes Ethereum and Avalanche, not Base/Arbitrum/Polygon/BNB.
    if (chain.id === "ethereum" || chain.id === "avalanche") loaders.push(() => legacyHistory(chain, address, true, signal));
    for (const load of loaders) {
      if (signal.aborted) break;
      try { return await load(); } catch { /* Continue to the next independent data source. */ }
    }
    if (!process.env.ETHERSCAN_API_KEY && (!chain.api || !process.env.BLOCKSCOUT_API_KEY))
      throw new Error(`${chain.name} history needs a configured data source. ${chain.api ? "Set BLOCKSCOUT_API_KEY or " : "Set "}ETHERSCAN_API_KEY with access to this network.`);
    throw new Error(`${chain.name} history sources are temporarily unavailable. Retry shortly or check provider chain access.`);
  });
