/** arbitrum provider. Shared EVM normalization lives in evm.ts. */
import { getEvmStats } from "./evm";
import { networkById } from "./types";
export const getStats = (address: string) =>
  getEvmStats(networkById("arbitrum")!, address);
