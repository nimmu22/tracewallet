export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const cycle = "8s";
const colors = { source: "#4ee4ce", eth: "#b7a5ff", bnb: "#f0b90b", tron: "#ff6577" };
type Chain = "eth" | "bnb" | "tron";

function ChainSymbol({ chain }: { chain: Chain }) {
  if (chain === "eth") return <g>
    <path d="M0-20 12 0 0 7-12 0Z" fill="currentColor" />
    <path d="M0-20V7L12 0Z" fill="#fff" opacity=".28" />
    <path d="M0 11 12 4 0 24-12 4Z" fill="currentColor" opacity=".8" />
  </g>;
  if (chain === "bnb") return <g fill="currentColor">
    <path d="m0-21 10 10-5 5-5-5-5 5-5-5ZM-21 0l5-5 5 5-5 5ZM21 0l-5-5-5 5 5 5ZM0 21l10-10-5-5-5 5-5-5-5 5Z" />
    <path d="m0-5 5 5-5 5-5-5Z" />
  </g>;
  // Filled negative-space facets keep the TRON mark crisp without route outlines.
  return <g fill="currentColor">
    <path d="M-18-17 20-9 1 25Zm5 5L1 17l3-21Z" fillRule="evenodd" />
    <path d="m-13-12 17 8 11-4ZM4-4 1 17 15-8Z" opacity=".4" />
  </g>;
}

function Impact({ at, color, small = false }: { at: number; color: string; small?: boolean }) {
  const start = at / 8;
  const peak = (at + .12) / 8;
  const end = (at + .8) / 8;
  const times = `0;${start};${peak};${end};1`;
  return <ellipse className="flow-impact" rx={small ? 20 : 42} ry={small ? 17 : 38} fill={color} opacity="0">
    <animate attributeName="opacity" values="0;0;.2;0;0" keyTimes={times} dur={cycle} repeatCount="indefinite" />
    <animate attributeName="rx" values={small ? "12;12;20;31;31" : "24;24;42;62;62"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
    <animate attributeName="ry" values={small ? "10;10;17;27;27" : "22;22;38;56;56"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
  </ellipse>;
}

function ChainNode({ x, y, chain, label }: { x: number; y: number; chain: Chain; label: string }) {
  return <g transform={`translate(${x} ${y})`} color={colors[chain]}>
    <Impact at={4.4} color={colors[chain]} />
    <path d="M-29-18 0-35 29-18V18L0 35-29 18Z" fill={`url(#flow-${chain}-face)`} />
    <path d="M-29-18 0-35 29-18 0-2Z" fill="currentColor" opacity=".09" />
    <path d="M0-2 29-18V18L0 35Z" fill="#000" opacity=".16" />
    <ChainSymbol chain={chain} />
    <text y="53" className="flow-label">{label}</text>
  </g>;
}

function AddressNode({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return <g transform={`translate(${x} ${y})`} color={color}>
    <Impact at={6.6} color={color} small />
    <path d="M-17-10 0-20 17-10V10L0 20-17 10Z" fill="currentColor" opacity=".1" />
    <rect x="-7" y="-6" width="5" height="5" rx="1" fill="currentColor" opacity=".8" />
    <rect x="2" y="-6" width="5" height="5" rx="1" fill="currentColor" opacity=".5" />
    <rect x="-7" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".5" />
    <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".8" />
    <text y="34" className="flow-address">{label}</text>
  </g>;
}

function Packet({ path, start, end, color, box = false, convert = false }: { path: string; start: number; end: number; color: string; box?: boolean; convert?: boolean }) {
  const a = start / 8;
  const b = end / 8;
  return <g className="flow-particle" opacity="0" fill={color}>
    <animateMotion path={path} rotate="auto" calcMode="linear" keyPoints="0;0;1;1" keyTimes={`0;${a};${b};1`} dur={cycle} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;1;0;0" keyTimes={`0;${a};${b};1`} calcMode="discrete" dur={cycle} repeatCount="indefinite" />
    {convert && <animate attributeName="fill" values={`${colors.source};${colors.source};${color};${color}`} keyTimes={`0;${a};${b};1`} dur={cycle} repeatCount="indefinite" />}
    <circle r="11" opacity=".035" />
    <circle r="6" opacity=".1" />
    <circle cx="-8" r="1.8" opacity=".25" />
    <circle cx="-14" r="1" opacity=".1" />
    {box ? <rect x="-3" y="-3" width="6" height="6" rx="1.5" /> : <circle r="2.6" />}
  </g>;
}

// One synchronized cycle: source → relay → three chains → illustrative addresses.
// Motion paths are never painted. This illustration does not imply TRON scan support.
export function BlockchainField() {
  return <div className="blockchain-field flow-field" aria-hidden="true">
    <svg viewBox="0 0 600 320" fill="none" className="flow-stage">
      <defs>
        {(["eth", "bnb", "tron"] as const).map(chain => <linearGradient id={`flow-${chain}-face`} key={chain} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors[chain]} stopOpacity=".22" />
          <stop offset="1" stopColor={colors[chain]} stopOpacity=".055" />
        </linearGradient>)}
        <linearGradient id="flow-source-face" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors.source} stopOpacity=".3" />
          <stop offset="1" stopColor={colors.source} stopOpacity=".07" />
        </linearGradient>
        <radialGradient id="flow-ambient">
          <stop stopColor={colors.source} stopOpacity=".05" />
          <stop offset="1" stopColor={colors.source} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="255" cy="160" rx="235" ry="146" fill="url(#flow-ambient)" />
      <g transform="translate(66 160)">
        <Impact at={.55} color={colors.source} />
        <g className="flow-source-form">
          <path d="M-32-19 0-38 32-19V19L0 38-32 19Z" fill="url(#flow-source-face)" />
          <path d="M-32-19 0-38 32-19 0 0Z" fill={colors.source} opacity=".2" />
          <path d="M0 0 32-19V19L0 38Z" fill="#000" opacity=".17" />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill={colors.source} opacity=".8" />
          <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#071311" />
        </g>
        <text y="58" className="flow-label">TRANSACTION</text>
      </g>
      <g transform="translate(218 160)">
        <Impact at={2} color={colors.source} />
        <path d="M-24-14 0-28 24-14V14L0 28-24 14Z" fill="url(#flow-source-face)" />
        <circle r="4" fill={colors.source} />
        <circle cx="10" cy="-9" r="2" fill={colors.source} opacity=".55" />
        <circle cx="12" r="2" fill={colors.source} opacity=".55" />
        <circle cx="10" cy="9" r="2" fill={colors.source} opacity=".55" />
      </g>
      <ChainNode x={390} y={64} chain="eth" label="ETHEREUM" />
      <ChainNode x={390} y={160} chain="bnb" label="BNB CHAIN" />
      <ChainNode x={390} y={256} chain="tron" label="TRON · TRC-20" />
      <AddressNode x={545} y={64} color={colors.eth} label="0x…8A2F" />
      <AddressNode x={515} y={140} color={colors.bnb} label="0x…B7C4" />
      <AddressNode x={562} y={195} color={colors.bnb} label="0x…D9E1" />
      <AddressNode x={545} y={256} color={colors.tron} label="T…K8m2" />
      <Packet path="M66 160 L218 160" start={.6} end={2} color={colors.source} box />
      <Packet path="M218 160 L390 64" start={2.25} end={4.4} color={colors.eth} convert />
      <Packet path="M218 160 L390 160" start={2.25} end={4.4} color={colors.bnb} convert />
      <Packet path="M218 160 L390 256" start={2.25} end={4.4} color={colors.tron} convert />
      <Packet path="M390 64 L545 64" start={4.7} end={6.6} color={colors.eth} />
      <Packet path="M390 160 L515 140" start={4.7} end={6.6} color={colors.bnb} />
      <Packet path="M390 160 L562 195" start={4.7} end={6.6} color={colors.bnb} />
      <Packet path="M390 256 L545 256" start={4.7} end={6.6} color={colors.tron} />
    </svg>
    <span className="field-caption mono">ILLUSTRATIVE MULTICHAIN FLOW</span>
  </div>;
}
