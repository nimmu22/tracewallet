"use client";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  AudioLines,
  Search,
  ArrowRight,
  ArrowUpRight,
  Wallet,
  Layers3,
  Globe2,
  ShieldCheck,
  Sun,
  Moon,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Opening, LiveClock } from "@/components/chaintrace/ambient";
import {
  networks,
  networkById,
  type ChainStats,
  type MarketData,
  type Network,
  type WalletTransaction,
} from "@/services/types";
import { addressKind } from "@/services/validation";
const ActivityChart = lazy(() =>
  import("@/components/chaintrace/charts").then((m) => ({
    default: m.ActivityChart,
  })),
);
const GasChart = lazy(() =>
  import("@/components/chaintrace/charts").then((m) => ({
    default: m.GasChart,
  })),
);
const short = (s: string) =>
  s.length > 16 ? s.slice(0, 6) + "…" + s.slice(-5) : s;
const date = (s: string | null | undefined) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Unavailable";
const usd = (n: number | null | undefined) =>
  n == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(n);
const amount = (n: number | null | undefined) =>
  n == null
    ? "Unavailable"
    : n === 0
      ? "0"
      : n < 0.000001
        ? n.toExponential(2)
        : n.toLocaleString("en-US", { maximumFractionDigits: 6 });
function age(first: string | null) {
  if (!first) return "Unavailable";
  const a = new Date(first),
    b = new Date();
  let months =
    (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  if (b.getDate() < a.getDate()) months--;
  months = Math.max(0, months);
  return months < 1
    ? "Less than a month"
    : `${Math.floor(months / 12)}y ${months % 12}m`;
}
function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="hint" aria-label={text}>
          <Info size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72" sideOffset={7}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
function NetIcon({ network }: { network: Network }) {
  return (
    <span
      className={"network-icon n" + networks.indexOf(network)}
      aria-hidden="true"
    >
      {network.icon}
    </span>
  );
}
interface ChainState {
  status: "scanning" | "done" | "error";
  data?: ChainStats;
  error?: string;
}
interface WalletProfile {
  address: string;
  name: string | null;
  kind: "evm" | "solana";
}
async function json<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  const d = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(d.error || "The request could not be completed.");
  return d;
}
export default function Home() {
  const [input, setInput] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState<WalletProfile | null>(null),
    [chains, setChains] = useState<Record<string, ChainState>>({});
  const [market, setMarket] = useState<MarketData | null>(null),
    [marketError, setMarketError] = useState(""),
    [marketBusy, setMarketBusy] = useState(true);
  const [theme, setTheme] = useState("dark"),
    [copied, setCopied] = useState(false),
    [range, setRange] = useState("30D"),
    [filter, setFilter] = useState("all"),
    [limit, setLimit] = useState(10);
  const active = useRef<AbortController | null>(null),
    running = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    try {
      const t = localStorage.getItem("chaintrace-theme") || "dark";
      setTheme(t);
      document.documentElement.dataset.theme = t;
    } catch {}
    return () => active.current?.abort();
  }, []);
  const switchTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("chaintrace-theme", t);
    } catch {}
  };
  // Validate after a short pause, but never send input to a provider until the user submits it.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim() && !addressKind(input))
        setError(
          "Enter a valid public EVM address, Solana address, or .eth name.",
        );
      else setError("");
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      setMarketBusy(true);
      try {
        const d = await json<MarketData>("/api/market", controller.signal);
        setMarket(d);
        setMarketError("");
      } catch (e) {
        if (!controller.signal.aborted)
          setMarketError(
            e instanceof Error ? e.message : "Market unavailable.",
          );
      } finally {
        if (!controller.signal.aborted) setMarketBusy(false);
        inFlight = false;
      }
    };
    void refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const analyze = useCallback(async (value: string) => {
    const trimmed = value.trim(),
      kind = addressKind(trimmed);
    if (!kind) {
      setError(
        "Enter a valid public EVM address, Solana address, or .eth name.",
      );
      throw new Error("Invalid public address.");
    }
    if (running.current) throw new Error("A wallet scan is already running.");
    running.current = true;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setInput(trimmed);
    setError("");
    setBusy(true);
    setChains({});
    setWallet(null);
    setFilter("all");
    setLimit(10);
    try {
      // Plain addresses can begin scanning immediately; optional reverse ENS never blocks them.
      const profile: WalletProfile =
        kind === "ens"
          ? await json<WalletProfile>(
              "/api/resolve?address=" + encodeURIComponent(trimmed),
              controller.signal,
            )
          : { address: trimmed, name: null, kind };
      setWallet(profile);
      const compatible = networks.filter(
        (n) => (n.id === "solana") === (profile.kind === "solana"),
      );
      setChains(
        Object.fromEntries(
          compatible.map((n) => [n.id, { status: "scanning" }]),
        ),
      );
      if (kind === "evm")
        void json<WalletProfile>(
          "/api/resolve?address=" + encodeURIComponent(trimmed),
          controller.signal,
        )
          .then((p) => {
            if (!controller.signal.aborted) setWallet(p);
          })
          .catch(() => {});
      // Independent API routes isolate provider failures and allow each network card to finish on its own.
      const results = await Promise.allSettled(
        compatible.map(async (n) => {
          try {
            const data = await json<ChainStats>(
              `/api/wallet?chain=${n.id}&address=${encodeURIComponent(profile.address)}`,
              controller.signal,
            );
            if (!controller.signal.aborted)
              setChains((s) => ({ ...s, [n.id]: { status: "done", data } }));
            return data;
          } catch (e) {
            if (!controller.signal.aborted)
              setChains((s) => ({
                ...s,
                [n.id]: {
                  status: "error",
                  error:
                    e instanceof Error
                      ? e.message
                      : "Network temporarily unavailable.",
                },
              }));
            throw e;
          }
        }),
      );
      return {
        address: profile.address,
        networksLoaded: results.filter((r) => r.status === "fulfilled").length,
        networksUnavailable: results.filter((r) => r.status === "rejected")
          .length,
      };
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Wallet lookup failed.");
      throw e;
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      running.current = false;
    }
  }, []);
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: object,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    // The agent tool uses the same validation, progress states and public-data boundary as the form.
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "analyze_public_wallet",
            title: "Analyze a public wallet",
            description:
              "Analyze a public EVM or Solana address or .eth name and show results on this dashboard.",
            inputSchema: {
              type: "object",
              properties: { address: { type: "string", maxLength: 255 } },
              required: ["address"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (payload: unknown) => {
              if (
                !payload ||
                typeof payload !== "object" ||
                !("address" in payload) ||
                typeof payload.address !== "string"
              )
                throw new Error("A public address is required.");
              const result = await analyze(payload.address);
              await new Promise((r) => requestAnimationFrame(r));
              return result;
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [analyze]);
  const visible = wallet
    ? networks.filter((n) => (n.id === "solana") === (wallet.kind === "solana"))
    : networks;
  const stats = Object.values(chains).flatMap((s) => (s.data ? [s.data] : [])),
    completed = Object.values(chains).filter(
      (s) => s.status !== "scanning",
    ).length;
  const txs = stats
    .flatMap((s) => s.latestTransactions)
    .sort(
      (a, b) =>
        (Date.parse(b.timestamp ?? "") || 0) -
        (Date.parse(a.timestamp ?? "") || 0),
    );
  const total = stats.reduce((s, n) => s + n.transactionCount, 0),
    used = stats.filter((n) => n.transactionCount > 0).length;
  const partial =
    stats.some((s) => !s.complete) || stats.length < visible.length;
  const first =
    stats
      .map((s) => s.firstActivity)
      .filter((s): s is string => !!s)
      .sort()[0] ?? null;
  const latest = txs.find((t) => t.timestamp)?.timestamp ?? null;
  const most = [...stats].sort(
    (a, b) => b.transactionCount - a.transactionCount,
  )[0];
  const gasData = stats.flatMap((s) => {
    const n = networkById(s.chain)!,
      price = market?.prices[n.coinId];
    return s.gasSpentNative !== null && price !== undefined
      ? [
          {
            name: n.name,
            value: s.gasSpentNative * price,
            color: n.color,
            chain: n.id,
          },
        ]
      : [];
  });
  const gasUSD = gasData.length
    ? gasData.reduce((s, n) => s + n.value, 0)
    : null;
  const paid = txs.filter((t) => t.paidByWallet && t.fee !== null);
  const pricedPaid = paid.flatMap((t) => {
    const p = market?.prices[networkById(t.chain)!.coinId];
    return p !== undefined ? [{ ...t, usd: t.fee! * p }] : [];
  });
  const highest = [...pricedPaid].sort((a, b) => b.usd - a.usd)[0];
  const nativeTotals: Record<string, number> = {};
  for (const s of stats)
    if (s.gasSpentNative !== null) {
      const symbol = networkById(s.chain)!.symbol;
      nativeTotals[symbol] = (nativeTotals[symbol] ?? 0) + s.gasSpentNative;
    }
  const filtered = txs.filter((t) => filter === "all" || t.chain === filter),
    shown = filtered.slice(0, limit);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void analyze(input).catch(() => {});
  };
  const copy = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy unavailable. Select the address to copy it manually.");
    }
  };
  const metrics = [
    {
      label: "FIRST ACTIVITY",
      value: wallet ? date(first) : "—",
      detail: wallet
        ? `Wallet age: ${age(first)}`
        : "Earliest activity found on-chain",
      hint: "Calculated from the earliest transaction found on-chain. Not the wallet creation date; unavailable networks may have older activity.",
    },
    {
      label: partial && wallet ? "TRANSACTIONS LOADED" : "TOTAL TRANSACTIONS",
      value: stats.length
        ? total.toLocaleString() + (partial ? "+" : "")
        : wallet
          ? "Unavailable"
          : "—",
      detail: wallet
        ? `${stats.length} of ${visible.length} networks available`
        : "Across compatible networks",
      hint: "Normal EVM transactions or Solana signatures. Token transfers and internal calls are not counted separately.",
    },
    {
      label: "CHAINS USED",
      value: stats.length
        ? String(used) + (partial ? "+" : "")
        : wallet
          ? "Unavailable"
          : "—",
      detail:
        most && most.transactionCount
          ? `Most active in sample: ${networkById(most.chain)?.name}`
          : "Network footprint",
      hint: "Networks with at least one returned transaction. Unavailable networks are not treated as unused.",
    },
    {
      label: "EST. GAS COST",
      value: wallet ? usd(gasUSD) : "—",
      detail: "Estimated using current token price",
      hint: "Wallet-paid fees in the loaded sample only. Excludes networks with unavailable fees or prices. This is not an exact historical cost.",
    },
  ];
  return (
    <TooltipProvider delayDuration={150}>
      <Opening />
      <header className="topbar">
        <a className="brand" href="#">
          <AudioLines />
          <b>CHAINTRACE</b>
          <small>WALLET INTELLIGENCE</small>
        </a>
        <div className="header-right">
          <span className="header-status">
            <i /> PUBLIC DATA
          </span>
          <LiveClock />
          <button
            onClick={switchTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div>
            <div className="eyebrow">ON-CHAIN EXPLORER</div>
            <h1>Every chain. One clear picture.</h1>
            <p>Trace the activity behind any public wallet.</p>
          </div>
          <span className="read-only">
            <ShieldCheck size={15} /> Read-only by design
          </span>
        </div>
        <form
          className={"search-box" + (error ? " invalid" : "")}
          onSubmit={onSubmit}
        >
          <Search size={21} />
          <input
            aria-label="Wallet address or ENS"
            aria-describedby={error ? "search-error" : undefined}
            aria-invalid={!!error}
            autoComplete="off"
            spellCheck={false}
            maxLength={255}
            placeholder="Enter wallet address or ENS"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <span>EVM / SOL / ENS</span>
          <button className="primary" disabled={busy}>
            {busy ? "Analyzing wallet" : "Analyze Wallet"}
            {busy ? (
              <RefreshCw className="spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </form>
        {error && (
          <p id="search-error" className="inline-error" role="alert">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        <div className="search-meta">
          <span>
            <i />
            {wallet
              ? `${visible.length} compatible networks`
              : "8 networks. One search."}
            <span className="meta-divider">/</span>
            <button
              className="example-link"
              disabled={busy}
              onClick={() =>
                void analyze(
                  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                ).catch(() => {})
              }
            >
              Explore Vitalik’s wallet <ArrowUpRight size={12} />
            </button>
          </span>
          <span>Public addresses only. No wallet connection needed.</span>
        </div>
        <nav className="section-nav" aria-label="Dashboard sections">
          <a className="active" href="#overview">
            <Wallet size={16} />
            Wallet overview
          </a>
          <a href="#networks">
            <Layers3 size={16} />
            Networks
          </a>
          <a href="#recent">
            <Activity size={16} />
            Activity
          </a>
          <a href="#market">
            <Globe2 size={16} />
            Market
          </a>
        </nav>
        <section className="identity" id="overview">
          <div className="wallet-avatar">
            <Wallet />
          </div>
          <div className="wallet-heading">
            <h2>
              {wallet ? (
                <>
                  <span>{wallet.name || short(wallet.address)}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="inline-icon"
                        onClick={copy}
                        aria-label="Copy wallet address"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied" : wallet.address}
                    </TooltipContent>
                  </Tooltip>
                  <a
                    className="inline-icon"
                    href={`${wallet.kind === "solana" ? "https://solscan.io" : "https://etherscan.io"}/address/${wallet.address}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View wallet in explorer"
                  >
                    <ExternalLink size={14} />
                  </a>
                </>
              ) : (
                "Your wallet, in focus"
              )}
            </h2>
            <p>
              {wallet ? (
                <span className="mono" title={wallet.address}>
                  {short(wallet.address)}{" "}
                  <span className="muted">
                    {" "}
                    ·{" "}
                    {busy
                      ? "Scanning public activity"
                      : `Last analyzed ${new Date(stats[0]?.fetchedAt ?? Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                </span>
              ) : (
                "Enter an address to build its on-chain profile."
              )}
            </p>
          </div>
          <span className="badge">
            {busy
              ? "SCANNING"
              : wallet
                ? stats.length
                  ? "PUBLIC WALLET"
                  : "DATA UNAVAILABLE"
                : "AWAITING ADDRESS"}
          </span>
          {wallet && !busy && (
            <button
              className="icon-button"
              aria-label="Refresh wallet"
              onClick={() => void analyze(wallet.address).catch(() => {})}
            >
              <RefreshCw size={15} />
            </button>
          )}
        </section>
        {busy && (
          <div className="scan-panel" role="status">
            <div>
              <span>
                <RefreshCw className="spin" size={14} />
                {wallet
                  ? "Checking networks and calculating wallet-paid fees"
                  : "Resolving ENS name"}
              </span>
              <span>
                {completed} / {visible.length}
              </span>
            </div>
            <Progress value={wallet ? (completed / visible.length) * 100 : 5} />
            <div className="scan-networks">
              {visible.map((n) => (
                <span key={n.id}>
                  {chains[n.id]?.status === "done" ? (
                    <CheckCircle2 size={12} />
                  ) : chains[n.id]?.status === "error" ? (
                    <AlertCircle size={12} />
                  ) : (
                    <span className="scan-dot" />
                  )}
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <motion.div
          className="stats-grid"
          initial={false}
          animate={{ opacity: busy ? 0.65 : 1 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {metrics.map((m) => (
            <div className="stat" key={m.label}>
              <div className="stat-label">
                {m.label}
                <Hint text={m.hint} />
              </div>
              <strong
                className={m.label === "FIRST ACTIVITY" ? "date-value" : ""}
              >
                {m.value}
              </strong>
              <span>{m.detail}</span>
            </div>
          ))}
        </motion.div>
        {wallet && (
          <div className="coverage">
            <Info size={14} />
            <p>
              {busy
                ? "Results appear as each network responds."
                : stats.length === 0
                  ? "No network data could be retrieved. Review the provider notices below and retry."
                  : partial
                    ? "Partial coverage. Transaction counts, charts and gas spending reflect the loaded sample, not lifetime totals."
                    : "Provider history loaded. Counts cover normal transactions, not separate token transfers or internal calls."}
            </p>
            <span>Latest activity: {date(latest)}</span>
          </div>
        )}
        <div className="chart-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Transaction activity</h2>
                <p>
                  {wallet
                    ? "Transactions in the loaded history"
                    : "A timeline of your on-chain activity"}
                </p>
              </div>
              <Tabs value={range} onValueChange={setRange}>
                <TabsList className="ranges">
                  {["7D", "30D", "90D", "1Y", "ALL"].map((r) => (
                    <TabsTrigger value={r} key={r}>
                      {r}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            {txs.length ? (
              <Suspense fallback={<Skeleton className="h-56 mx-5 mb-4" />}>
                <ActivityChart transactions={txs} range={range} />
              </Suspense>
            ) : (
              <div className="chart-empty">
                <Activity size={30} />
                <h3>
                  {busy
                    ? "Tracing your activity"
                    : wallet
                      ? "No transaction history available"
                      : "The story starts with an address"}
                </h3>
                <p>
                  {busy
                    ? "Each network is checked independently."
                    : wallet
                      ? "See network coverage and provider notices below."
                      : "Your transaction history will appear here."}
                </p>
              </div>
            )}
            <div className="panel-bottom">
              <span>
                <i className="blue-dot" />{" "}
                {wallet
                  ? `${total.toLocaleString()} transactions loaded`
                  : "Transactions over time"}
              </span>
              <span>
                {wallet
                  ? "Sample coverage · UTC dates"
                  : "Public, on-chain activity"}
              </span>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Gas spending</h2>
                <p>Gas spent by network</p>
              </div>
              <span className="muted">
                USD{" "}
                <Hint text="Estimated using current token price. Only wallet-paid fees in the loaded history are included." />
              </span>
            </div>
            {gasUSD !== null && gasUSD > 0 ? (
              <div className="gas-visual">
                <div className="donut">
                  <Suspense fallback={<Skeleton className="h-40" />}>
                    <GasChart data={gasData.filter((d) => d.value > 0)} />
                  </Suspense>
                  <div className="donut-label">
                    <strong>{usd(gasUSD)}</strong>
                    <small>LOADED FEES</small>
                  </div>
                </div>
                <div className="gas-legend">
                  {gasData
                    .filter((d) => d.value > 0)
                    .map((d) => (
                      <div key={d.name}>
                        <span>
                          <i style={{ background: d.color }} />
                          {d.name}
                        </span>
                        <b>{Math.round((d.value / gasUSD) * 100)}%</b>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="gas-empty">
                <div className="empty-ring">
                  <span>
                    {gasUSD === 0 ? "$0" : "—"}
                    <small>GAS SPENT</small>
                  </span>
                </div>
                <p>
                  {wallet
                    ? "No priced wallet-paid fees available in this sample."
                    : "Analyze a wallet to see its gas footprint."}
                </p>
              </div>
            )}
            <div className="panel-bottom">
              <span>Estimated using current token price</span>
              <Hint text="Unknown prices or fees remain unavailable. Different native assets are never summed together." />
            </div>
          </section>
        </div>
        {wallet && (
          <div className="gas-details">
            <div>
              <label>NATIVE FEES · LOADED</label>
              <b>
                {Object.entries(nativeTotals)
                  .map(([s, n]) => `${amount(n)} ${s}`)
                  .join(" + ") || "Unavailable"}
              </b>
            </div>
            <div>
              <label>GAS UNITS · LOADED EVM</label>
              <b>
                {stats.some((s) => s.gasUsed !== null)
                  ? stats
                      .reduce((sum, s) => sum + (s.gasUsed ?? 0), 0)
                      .toLocaleString()
                  : "Unavailable"}
              </b>
            </div>
            <div>
              <label>AVG. PRICED FEE</label>
              <b>
                {pricedPaid.length
                  ? usd(
                      pricedPaid.reduce((s, t) => s + t.usd, 0) /
                        pricedPaid.length,
                    )
                  : "Unavailable"}
              </b>
            </div>
            <div>
              <label>HIGHEST PRICED FEE</label>
              <b>
                {highest ? (
                  <a
                    href={`${networkById(highest.chain)!.explorer}/tx/${highest.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {usd(highest.usd)} <ArrowUpRight size={12} />
                  </a>
                ) : (
                  "Unavailable"
                )}
              </b>
            </div>
          </div>
        )}
        <section id="networks">
          <div className="section-heading">
            <h2>
              Activity by network{" "}
              <small>{String(visible.length).padStart(2, "0")}</small>
            </h2>
            <span>Automatically matched to your address</span>
          </div>
          <div className="network-grid">
            {visible.map((n) => {
              const state = chains[n.id],
                s = state?.data;
              const share = total && s ? (s.transactionCount / total) * 100 : 0;
              return (
                <article className="network-card" key={n.id}>
                  <div className="network-title">
                    <NetIcon network={n} />
                    <h3>{n.name}</h3>
                    <i
                      className={
                        state?.status === "done"
                          ? "done"
                          : state?.status === "error"
                            ? "failed"
                            : ""
                      }
                    />
                  </div>
                  {state?.status === "scanning" ? (
                    <Skeleton className="h-8 w-20 my-5" />
                  ) : (
                    <div className="network-total">
                      {s
                        ? s.transactionCount.toLocaleString() +
                          (!s.complete ? "+" : "")
                        : "—"}{" "}
                      <small>
                        {s && !s.complete
                          ? "loaded transactions"
                          : "transactions"}
                      </small>
                    </div>
                  )}
                  <div className="network-row">
                    <span>First activity</span>
                    <span>{wallet ? date(s?.firstActivity) : "—"}</span>
                  </div>
                  <div className="network-row">
                    <span>Last activity</span>
                    <span>{wallet ? date(s?.lastActivity) : "—"}</span>
                  </div>
                  <div className="network-row">
                    <span>Gas spent</span>
                    <span>
                      {s?.gasSpentNative != null
                        ? `${amount(s.gasSpentNative)} ${n.symbol}`
                        : wallet
                          ? "Unavailable"
                          : "—"}
                    </span>
                  </div>
                  <div className="network-row">
                    <span>Est. gas cost</span>
                    <span>
                      {s?.gasSpentNative != null &&
                      market?.prices[n.coinId] !== undefined
                        ? usd(s.gasSpentNative * market.prices[n.coinId])
                        : wallet
                          ? "Unavailable"
                          : "—"}
                    </span>
                  </div>
                  <div className="network-track">
                    <div
                      style={{
                        width: `${share}%`,
                        background: n.color,
                        height: "100%",
                      }}
                    />
                  </div>
                  <div className="network-row">
                    <span>
                      {state?.status === "scanning"
                        ? "Scanning network"
                        : state?.status === "error"
                          ? "Provider unavailable"
                          : s
                            ? "Share of loaded activity"
                            : "Waiting for wallet"}
                    </span>
                    <span>{s ? `${share.toFixed(1)}%` : "—"}</span>
                  </div>
                  {state?.error && (
                    <p className="provider-note">{state.error}</p>
                  )}
                  {s && (
                    <p className="provider-note">
                      {s.note}{" "}
                      <a
                        href={`${n.explorer}/address/${wallet!.address}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Explorer ↗
                      </a>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <section className="panel recent-panel" id="recent">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>
                {wallet
                  ? "Latest transactions across your networks"
                  : "A closer look at every transaction"}
              </p>
            </div>
            <Select
              value={filter}
              onValueChange={(v) => {
                setFilter(v);
                setLimit(10);
              }}
            >
              <SelectTrigger aria-label="Filter transactions by network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All networks</SelectItem>
                {visible.map((n) => (
                  <SelectItem value={n.id} key={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {shown.length ? (
            <>
              <div className="desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        "Network",
                        "Transaction hash",
                        "Type",
                        "From",
                        "To",
                        "Value",
                        "Gas fee¹",
                        "Time",
                        "Status",
                      ].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shown.map((t) => (
                      <TransactionRow key={t.chain + t.hash} tx={t} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mobile-transactions">
                {shown.map((t) => (
                  <TransactionMobile key={t.chain + t.hash} tx={t} />
                ))}
              </div>
              <div className="table-footer">
                <span>
                  Showing {shown.length} of {filtered.length} loaded · ¹
                  Transaction fee paid by sender
                </span>
                {limit < filtered.length && (
                  <button
                    className="secondary-button"
                    onClick={() => setLimit((l) => l + 10)}
                  >
                    View more <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="table-empty">
              <Layers3 size={24} />
              <span>
                {busy
                  ? "Looking for recent transactions…"
                  : wallet
                    ? "No transactions available for this selection."
                    : "Your transactions will appear here after analysis."}
              </span>
            </div>
          )}
        </section>
        <section className="panel market-panel" id="market">
          <div className="panel-heading">
            <div>
              <h2>
                Market{" "}
                <span className="live-label">
                  <i />
                  {marketError ? "LAST KNOWN PRICES" : market ? "CURRENT PRICES" : "MARKET DATA"}
                </span>
              </h2>
              <p>Top 10 cryptocurrencies by market capitalization</p>
            </div>
            <span className="market-updated">
              {market
                ? `Last updated ${new Date(market.updatedAt).toLocaleTimeString("en-US")}`
                : marketBusy
                  ? "Fetching current prices"
                  : "Prices unavailable"}
              {marketBusy && <RefreshCw className="spin" size={12} />}
            </span>
          </div>
          {marketError && (
            <div className="market-error" role="status">
              <AlertCircle size={14} />
              {market ? "Showing last successful prices. " : ""}
              {marketError}
            </div>
          )}
          {market ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="rank">#</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">24h change</TableHead>
                  <TableHead className="market-cap text-right">
                    Market cap
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {market.coins.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="rank muted mono">
                      {c.market_cap_rank}
                    </TableCell>
                    <TableCell>
                      <span className="coin-name">
                        {c.image ? <img
                          src={c.image}
                          alt=""
                          width={27}
                          height={27}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        /> : <span className="coin-monogram" aria-hidden="true">{c.symbol.slice(0,1)}</span>}
                        <span>
                          {c.name}
                          <small>{c.symbol.toUpperCase()}</small>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right mono">
                      {usd(c.current_price)}
                    </TableCell>
                    <TableCell
                      className={
                        "text-right mono " +
                        (c.price_change_percentage_24h == null
                          ? "muted"
                          : c.price_change_percentage_24h >= 0
                            ? "positive"
                            : "negative")
                      }
                    >
                      {c.price_change_percentage_24h == null
                        ? "Unavailable"
                        : `${c.price_change_percentage_24h >= 0 ? "+" : ""}${c.price_change_percentage_24h.toFixed(2)}%`}
                    </TableCell>
                    <TableCell className="market-cap text-right mono muted">
                      {c.market_cap === null
                        ? "Unavailable"
                        : new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            notation: "compact",
                            maximumFractionDigits: 2,
                          }).format(c.market_cap)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : marketBusy ? (
            <div className="market-skeleton">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton className="h-9 w-full" key={i} />
              ))}
            </div>
          ) : (
            <div className="table-empty">
              <Globe2 size={24} />
              <span>
                Current market prices are unavailable. We’ll retry
                automatically.
              </span>
            </div>
          )}
          <div className="panel-bottom">
            <span>
              Market data by{" "}
              <a
                href={market?.source === "CoinPaprika" ? "https://coinpaprika.com" : "https://www.coingecko.com"}
                target="_blank"
                rel="noreferrer"
              >
                {market?.source || "CoinGecko"} ↗
              </a>
            </span>
            <span>Refreshes every 60 seconds</span>
          </div>
        </section>
        <footer>
          <span className="brand">
            <AudioLines size={17} />
            CHAINTRACE
          </span>
          <p>
            CHAINTRACE only reads publicly available blockchain data. Never
            enter a seed phrase or private key.
          </p>
          <span>Built for clarity.</span>
        </footer>
      </main>
    </TooltipProvider>
  );
}
function TransactionRow({ tx: t }: { tx: WalletTransaction }) {
  const n = networkById(t.chain)!;
  return (
    <TableRow>
      <TableCell>
        <span className="table-network">
          <NetIcon network={n} />
          {n.name}
        </span>
      </TableCell>
      <TableCell>
        <a
          className="hash mono"
          href={`${n.explorer}/tx/${t.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          {short(t.hash)}
          <ArrowUpRight size={12} />
        </a>
      </TableCell>
      <TableCell>
        <span className="tx-type">{t.type.slice(0, 20)}</span>
      </TableCell>
      <TableCell className="mono muted">
        <span title={t.from ?? undefined}>
          {t.from ? short(t.from) : "Unavailable"}
        </span>
      </TableCell>
      <TableCell className="mono muted">
        <span title={t.to ?? undefined}>
          {t.to ? short(t.to) : "Unavailable"}
        </span>
      </TableCell>
      <TableCell className="mono">
        {amount(t.value)}
        {t.value !== null ? " " + n.symbol : ""}
      </TableCell>
      <TableCell className="mono muted">
        {amount(t.fee)}
        {t.fee !== null ? " " + n.symbol : ""}
      </TableCell>
      <TableCell className="muted">
        <span title={t.timestamp ?? undefined}>{date(t.timestamp)}</span>
      </TableCell>
      <TableCell>
        <span className={"tx-status " + t.status}>
          {t.status === "success"
            ? "Success"
            : t.status === "failed"
              ? "Failed"
              : "Unknown"}
        </span>
      </TableCell>
    </TableRow>
  );
}
function TransactionMobile({ tx: t }: { tx: WalletTransaction }) {
  const n = networkById(t.chain)!;
  return (
    <article className="transaction-mobile">
      <div>
        <span className="table-network">
          <NetIcon network={n} />
          {n.name}
        </span>
        <span className={"tx-status " + t.status}>{t.status}</span>
      </div>
      <a
        className="hash mono"
        href={`${n.explorer}/tx/${t.hash}`}
        target="_blank"
        rel="noreferrer"
      >
        {short(t.hash)}
        <ArrowUpRight size={12} />
      </a>
      <div>
        <span>{t.type}</span>
        <span>
          {amount(t.value)} {t.value !== null ? n.symbol : ""}
        </span>
      </div>
      <div className="muted">
        <span title={t.from ?? ""}>
          From {t.from ? short(t.from) : "Unavailable"}
        </span>
        <span title={t.to ?? ""}>To {t.to ? short(t.to) : "Unavailable"}</span>
      </div>
      <div className="muted">
        <span>
          Fee {amount(t.fee)} {t.fee !== null ? n.symbol : ""}
        </span>
        <span>{date(t.timestamp)}</span>
      </div>
    </article>
  );
}

