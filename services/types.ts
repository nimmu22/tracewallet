/** Shared provider contract. Dates are ISO strings so server responses serialize consistently. */
export interface Network {
  id: string;
  name: string;
  symbol: string;
  coinId: string;
  chainId?: number;
  explorer: string;
  api?: string;
  color: string;
  icon: string;
}
export interface WalletTransaction {
  hash: string;
  chain: string;
  timestamp: string | null;
  from: string | null;
  to: string | null;
  value: number | null;
  fee: number | null;
  gasUsed: number | null;
  paidByWallet: boolean;
  type: string;
  status: "success" | "failed" | "unknown";
}
export interface ChainStats {
  chain: string;
  transactionCount: number;
  complete: boolean;
  firstActivity: string | null;
  lastActivity: string | null;
  gasSpentNative: number | null;
  gasUsed: number | null;
  feeTransactionCount: number;
  latestTransactions: WalletTransaction[];
  provider: string;
  note: string;
  fetchedAt: string;
}
export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  market_cap_rank: number;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  last_updated: string;
}
export interface MarketData { source: "CoinGecko" | "CoinPaprika";
  coins: MarketCoin[];
  prices: Record<string, number>;
  updatedAt: string;
}
export const networks: Network[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    coinId: "ethereum",
    chainId: 1,
    explorer: "https://etherscan.io",
    api: "https://eth.blockscout.com",
    color: "#8b9bc5",
    icon: "Ξ",
  },
  {
    id: "base",
    name: "Base",
    symbol: "ETH",
    coinId: "ethereum",
    chainId: 8453,
    explorer: "https://basescan.org",
    api: "https://base.blockscout.com",
    color: "#4d7cfe",
    icon: "●",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ETH",
    coinId: "ethereum",
    chainId: 42161,
    explorer: "https://arbiscan.io",
    api: "https://arbitrum.blockscout.com",
    color: "#73a5c6",
    icon: "A",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "ETH",
    coinId: "ethereum",
    chainId: 10,
    explorer: "https://optimistic.etherscan.io",
    api: "https://optimism.blockscout.com",
    color: "#c17880",
    icon: "OP",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "POL",
    coinId: "polygon-ecosystem-token",
    chainId: 137,
    explorer: "https://polygonscan.com",
    api: "https://polygon.blockscout.com",
    color: "#a08acb",
    icon: "∞",
  },
  {
    id: "bnb",
    name: "BNB Chain",
    symbol: "BNB",
    coinId: "binancecoin",
    chainId: 56,
    explorer: "https://bscscan.com",
    color: "#c1a969",
    icon: "◇",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    coinId: "avalanche-2",
    chainId: 43114,
    explorer: "https://snowtrace.io",
    color: "#c57e7e",
    icon: "▲",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    coinId: "solana",
    explorer: "https://solscan.io",
    color: "#82b7a4",
    icon: "≋",
  },
];
export const networkById = (id: string) => networks.find((n) => n.id === id);

