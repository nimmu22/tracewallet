/** Solana signature history. Fees are reported only where transaction details are available. */
import { fetchJSON, cached, isoSeconds } from "./http";
import { networks, type WalletTransaction } from "./types";
import { summarize } from "./evm";
async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const url =
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const result = await fetchJSON<{ result: T; error?: unknown }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (result.error || result.result === undefined)
    throw new Error("Solana RPC temporarily unavailable or rate limited.");
  return result.result;
}
export const getSolanaStats = (address: string) =>
  cached(`solana:${address}`, 120000, async () => {
    const chain = networks.find((n) => n.id === "solana")!;
    const rows = await rpc<
      { signature: string; blockTime: number | null; err: unknown }[]
    >("getSignaturesForAddress", [
      address,
      { limit: 100, commitment: "finalized" },
    ]);
    const txs: WalletTransaction[] = rows.map((t) => ({
      hash: t.signature,
      chain: "solana",
      timestamp: isoSeconds(t.blockTime),
      from: null,
      to: null,
      value: null,
      fee: null,
      gasUsed: null,
      paidByWallet: false,
      type: "Transaction",
      status: t.err ? "failed" : "success",
    }));
    // Public RPCs throttle aggressively. Fetch ten details sequentially and stop on rate limiting.
    for (const tx of txs.slice(0, 10)) {
      try {
        const d = await rpc<{
          meta: { fee: number } | null;
          transaction: {
            message: {
              accountKeys: { pubkey: string }[];
              instructions: {
                parsed?: {
                  type?: string;
                  info?: {
                    source?: string;
                    destination?: string;
                    lamports?: number;
                  };
                };
              }[];
            };
          };
        } | null>("getTransaction", [
          tx.hash,
          {
            encoding: "jsonParsed",
            maxSupportedTransactionVersion: 0,
            commitment: "finalized",
          },
        ]);
        if (!d) continue;
        tx.from = d.transaction.message.accountKeys[0]?.pubkey ?? null;
        tx.paidByWallet = tx.from === address;
        tx.fee = d.meta ? d.meta.fee / 1e9 : null;
        const transfers = d.transaction.message.instructions.filter(
          (i) =>
            i.parsed?.type === "transfer" &&
            i.parsed.info?.lamports !== undefined,
        );
        // A single native transfer is unambiguous. Multi-instruction values stay unavailable.
        if (transfers.length === 1) {
          const info = transfers[0].parsed!.info!;
          tx.from = info.source ?? tx.from;
          tx.to = info.destination ?? null;
          tx.value = info.lamports! / 1e9;
          tx.type = tx.from === address ? "Send" : "Receive";
        }
      } catch {
        break;
      }
    }
    const stats = summarize(
      chain,
      txs,
      rows.length < 100,
      null,
      "Solana JSON-RPC",
      "Up to 100 signatures; details for up to 10. Total fees and first activity may be unavailable on non-archival RPCs.",
    );
    // Missing detail could hide additional wallet-paid fees; never turn unknown payers into zero fees.
    stats.gasSpentNative = null;
    stats.gasUsed = null;
    stats.firstActivity = null;
    stats.complete = false;
    return stats;
  });
