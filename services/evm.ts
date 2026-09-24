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
): Promise<ChainStats> {
  const base = chain.api!;
  let txs: WalletTransaction[] = [];
  let cursor: Record<string, string> | null = null;
  let complete = false;
  let interrupted = false;
  // Bound pagination to keep anonymous API use predictable. Coverage remains visible in every aggregate.
  for (let page = 0; page < 3; page++) {
    try {
      const query: string = cursor ? "?" + new URLSearchParams(cursor) : "";
      const data: {
        items: BlockTx[];
        next_page_params: Record<string, string> | null;
      } = await fetchJSON<{
        items: BlockTx[];
        next_page_params: Record<string, string> | null;
      }>(`${base}/api/v2/addresses/${address}/transactions${query}`);
      if (!Array.isArray(data.items))
        throw new Error("Unexpected provider response.");
      txs.push(
        ...data.items
          .filter((t) => normalHash.test(t.hash))
          .map((t) => normalize(t, chain, address)),
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
        `${base}/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=asc`,
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
    "Blockscout",
    complete
      ? "All normal transactions returned by this provider."
      : `${interrupted ? "Provider interrupted pagination. " : ""}Latest ${txs.length} normal transactions loaded; gas and charts cover this sample.`,
  );
}
async function etherscan(chain: Network, address: string): Promise<ChainStats> {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key)
    throw new Error(
      "Not supported by the current data provider. Configure ETHERSCAN_API_KEY for this network.",
    );
  const url = new URL("https://api.etherscan.io/v2/api");
  url.search = new URLSearchParams({
    chainid: String(chain.chainId),
    module: "account",
    action: "txlist",
    address,
    page: "1",
    offset: "150",
    sort: "desc",
    apikey: key,
  }).toString();
  const data = await fetchJSON<{
    status: string;
    message: string;
    result: LegacyTx[] | string;
  }>(url.toString());
  if (!Array.isArray(data.result))
    throw new Error(
      "The configured Etherscan plan could not serve this network.",
    );
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
        fee: raw ? native(raw) : null,
        gasUsed: Number(t.gasUsed),
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
      const old = await fetchJSON<{ result: LegacyTx[] }>(url.toString());
      if (Array.isArray(old.result))
        first = isoSeconds(old.result[0]?.timeStamp);
    } catch {}
  }
  // This fallback is used for BNB and Avalanche; L2s retain Blockscout's actual fee including network-specific components.
  return summarize(
    chain,
    txs,
    complete,
    first,
    "Etherscan V2",
    complete
      ? "All normal transactions returned by provider."
      : "Latest 150 normal transactions; fees and charts cover this sample.",
  );
}
export const getEvmStats = (chain: Network, address: string) =>
  cached(`${chain.id}:${address.toLowerCase()}`, 120000, () =>
    chain.api ? blockscout(chain, address) : etherscan(chain, address),
  );
