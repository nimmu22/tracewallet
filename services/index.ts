import { networks } from "./types";
import { getEvmStats } from "./evm";
import { getSolanaStats } from "./solana";
export async function getWalletChain(id: string, address: string) {
  const chain = networks.find((n) => n.id === id);
  if (!chain) throw new Error("Unknown network.");
  return id === "solana"
    ? getSolanaStats(address)
    : getEvmStats(chain, address);
}
