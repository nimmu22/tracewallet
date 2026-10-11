export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function EthereumShape({ x, y, scale = 1, large = false }: { x: number; y: number; scale?: number; large?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={large ? "flow-ethereum-main" : "flow-ethereum-small"}>
        <ellipse cy="6" rx="43" ry="55" fill="url(#flow-node-glow)" />
        <path d="M0-43 26 0 0 15-26 0Z" fill="url(#flow-eth-face)" />
        <path d="M0-43V15L26 0Z" fill="var(--primary)" opacity=".45" />
        <path d="M0 22 26 6 0 50-26 6Z" fill="url(#flow-eth-face)" />
        <path d="M0 22V50L26 6Z" fill="var(--primary)" opacity=".3" />
      </g>
    </g>
  );
}
const routes = [
  { path: "M102 144 C154 144 198 144 241 144", duration: 3.4 },
  { path: "M282 144 C336 144 345 65 420 65", duration: 4.1 },
  { path: "M282 144 C340 144 382 144 456 144", duration: 3.2 },
  { path: "M282 144 C340 144 356 225 420 225", duration: 4.5 },
  { path: "M191 44 C229 44 262 86 262 119", duration: 3.7 },
  { path: "M191 245 C229 245 262 199 262 168", duration: 4.2 },
];

// Only particles are drawn along the routes. The motion paths themselves are invisible.
// This is a decorative illustration, not a live bridge or transaction graph.
export function BlockchainField() {
  return (
    <div className="blockchain-field flow-field" aria-hidden="true">
      <svg viewBox="0 0 520 290" fill="none" className="flow-stage">
        <defs>
          <linearGradient id="flow-eth-face" x1="-26" y1="-43" x2="26" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--foreground)" stopOpacity=".95" />
            <stop offset=".5" stopColor="var(--primary)" stopOpacity=".82" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity=".35" />
          </linearGradient>
          <radialGradient id="flow-node-glow">
            <stop stopColor="var(--primary)" stopOpacity=".11" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flow-bridge-face" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--primary)" stopOpacity=".17" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity=".035" />
          </linearGradient>
        </defs>
        <ellipse cx="262" cy="144" rx="130" ry="95" fill="url(#flow-node-glow)" />
        <EthereumShape x={76} y={140} scale={1.05} large />
        <EthereumShape x={438} y={63} scale={.4} />
        <EthereumShape x={474} y={142} scale={.5} />
        <EthereumShape x={438} y={224} scale={.4} />
        <EthereumShape x={174} y={44} scale={.28} />
        <EthereumShape x={174} y={244} scale={.28} />
        <g transform="translate(262 144)">
          <rect x="-23" y="-28" width="46" height="56" rx="15" fill="url(#flow-bridge-face)" />
          <g className="flow-bridge-symbol" fill="var(--primary)">
            <path d="M-13-9h11v5h-6v14h-5Z" opacity=".7" />
            <path d="M13 9H2V4h6v-14h5Z" opacity=".9" />
            <rect x="-5" y="-2" width="10" height="4" rx="2" />
          </g>
        </g>
        {routes.flatMap(({ path, duration }, route) => [0, 1].map((packet) => (
          <g className="flow-particle" key={`${route}-${packet}`}>
            <animateMotion path={path} dur={`${duration}s`} begin={`${-(packet * duration / 2 + route * .3)}s`} repeatCount="indefinite" calcMode="paced" />
            <circle r="7" fill="var(--primary)" opacity=".07" />
            <circle r="3.5" fill="var(--primary)" opacity=".18" />
            <circle r="1.65" fill="var(--primary)" />
          </g>
        )))}
        <g fill="var(--muted-foreground)" fontFamily="monospace" fontSize="9" letterSpacing="1.8" textAnchor="middle">
          <text x="76" y="216">ETHEREUM</text>
          <text x="262" y="195">BRIDGE</text>
        </g>
      </svg>
      <span className="field-caption mono">ILLUSTRATIVE NETWORK FLOW</span>
    </div>
  );
}
