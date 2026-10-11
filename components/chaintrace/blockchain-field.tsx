export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const cycle = "8s";
const colors = { source: "#4ee4ce", eth: "#b7a5ff", bnb: "#f0b90b", tron: "#ff6577", base: "#528bff", sol: "#89f4bf" };
type Chain = Exclude<keyof typeof colors, "source">;

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
  if (chain === "base") return <g fill="currentColor">
    <path d="M-20-2a20 20 0 1 1 0 4H6V-2Z" />
  </g>;
  if (chain === "sol") return <g fill="currentColor">
    <path d="m-12-16 27 0-6 7h-27Zm-6 13h27l6 7h-27Zm6 13h27l-6 7h-27Z" />
  </g>;
  // Filled negative-space facets keep the TRON mark crisp without route outlines.
  return <g fill="currentColor">
    <path d="M-18-17 20-9 1 25Zm5 5L1 17l3-21Z" fillRule="evenodd" />
    <path d="m-13-12 17 8 11-4ZM4-4 1 17 15-8Z" opacity=".4" />
  </g>;
}

function Impact({ at, color, small = false }: { at: number; color: string; small?: boolean }) {
  const start = at / 8;
  const peak = (at + .1) / 8;
  const end = (at + .65) / 8;
  const times = `0;${start};${peak};${end};1`;
  return <g className="flow-impact">
    <ellipse rx="16" ry="16" fill={`url(#flow-halo-${color.slice(1)})`} opacity="0">
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={times} dur={cycle} repeatCount="indefinite" />
      <animate attributeName="rx" values={small ? "8;8;23;34;34" : "14;14;40;65;65"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
      <animate attributeName="ry" values={small ? "8;8;23;34;34" : "14;14;40;65;65"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
    </ellipse>
    {Array.from({ length: small ? 3 : 7 }, (_, i) => {
      const angle = (i * 2.399) + .3;
      const distance = small ? 24 : 42 + (i % 3) * 6;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      return <circle key={i} r={i % 2 ? 1 : 1.6} fill={color} opacity="0">
        <animate attributeName="cx" values={`0;0;${x * .32};${x};${x}`} keyTimes={times} dur={cycle} repeatCount="indefinite" />
        <animate attributeName="cy" values={`0;0;${y * .32};${y};${y}`} keyTimes={times} dur={cycle} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;.9;0;0" keyTimes={times} dur={cycle} repeatCount="indefinite" />
      </circle>;
    })}
  </g>;
}

function ChainNode({ x, y, chain, label, satellite = false, at = 4.4 }: { x: number; y: number; chain: Chain; label: string; satellite?: boolean; at?: number }) {
  return <g transform={`translate(${x} ${y})`} color={colors[chain]}>
    <Impact at={at} color={colors[chain]} small={satellite} />
    <g transform={`scale(${satellite ? .45 : .68})`}>
      <ellipse rx="50" ry="46" fill={`url(#flow-halo-${colors[chain].slice(1)})`} opacity=".18" />
      <path d="M-29-18 0-35 29-18V18L0 35-29 18Z" fill={`url(#flow-${chain}-face)`} />
      <path d="M-29-18 0-35 29-18 0-2Z" fill="currentColor" opacity=".12" />
      <path d="M0-2 29-18V18L0 35Z" fill="#000" opacity=".22" />
      <path d="M-29-18 0-35 29-18 27-18 0-33-27-18Z" fill="currentColor" opacity=".22" />
      <g transform="scale(.8)"><ChainSymbol chain={chain} /></g>
    </g>
    <text y={satellite ? 30 : 39} className={satellite ? "flow-label flow-satellite-label" : "flow-label"}>{label}</text>
  </g>;
}

function AddressNode({ x, y, color, label, at = 6.6 }: { x: number; y: number; color: string; label: string; at?: number }) {
  return <g transform={`translate(${x} ${y})`} color={color}>
    <Impact at={at} color={color} small />
    <g transform="scale(.82)">
    <path d="M-17-10 0-20 17-10V10L0 20-17 10Z" fill="currentColor" opacity=".1" />
    <rect x="-7" y="-6" width="5" height="5" rx="1" fill="currentColor" opacity=".8" />
    <rect x="2" y="-6" width="5" height="5" rx="1" fill="currentColor" opacity=".5" />
    <rect x="-7" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".5" />
    <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".8" />
    </g>
    <text y="29" className="flow-address">{label}</text>
  </g>;
}

function Packet({ path, start, end, color, box = false, convert = false }: { path: string; start: number; end: number; color: string; box?: boolean; convert?: boolean }) {
  const a = start / 8;
  const b = end / 8;
  return <g className="flow-particle" opacity="0" fill={color}>
    <animateMotion path={path} rotate="auto" calcMode="linear" keyPoints="0;0;1;1" keyTimes={`0;${a};${b};1`} dur={cycle} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;1;0;0" keyTimes={`0;${a};${b};1`} calcMode="discrete" dur={cycle} repeatCount="indefinite" />
    {convert && <animate attributeName="fill" values={`${colors.source};${colors.source};${color};${color}`} keyTimes={`0;${a};${b};1`} dur={cycle} repeatCount="indefinite" />}
    <circle r="13" fill={`url(#flow-packet-glow)`} opacity=".7" />
    <circle r="5" opacity=".16" />
    {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={-(i + 1) * 5} r={1.8 - i * .3} opacity={.3 - i * .055} />)}
    {box ? <rect x="-2.7" y="-2.7" width="5.4" height="5.4" rx="1.2" /> : <circle r="2.4" />}
    <circle r=".85" fill="#fff" opacity=".9" />
  </g>;
}

// One synchronized cycle with staggered satellite branches and arrival fragments.
// Motion paths are never painted. This illustration does not imply TRON scan support.
export function BlockchainField() {
  return <div className="blockchain-field flow-field" aria-hidden="true">
    <svg viewBox="0 0 600 340" fill="none" className="flow-stage">
      <defs>
        {(["eth", "bnb", "tron", "base", "sol"] as const).map(chain => <linearGradient id={`flow-${chain}-face`} key={chain} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors[chain]} stopOpacity=".22" />
          <stop offset="1" stopColor={colors[chain]} stopOpacity=".055" />
        </linearGradient>)}
        {Object.values(colors).map(color => <radialGradient id={`flow-halo-${color.slice(1)}`} key={color}>
          <stop stopColor={color} stopOpacity=".28" />
          <stop offset=".45" stopColor={color} stopOpacity=".085" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>)}
        <radialGradient id="flow-packet-glow">
          <stop stopColor="#c7fff2" stopOpacity=".35" />
          <stop offset="1" stopColor="#c7fff2" stopOpacity="0" />
        </radialGradient>
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
      <g className="flow-dust">
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={95 + (i * 71) % 460} cy={18 + (i * 47) % 286} r={i % 4 === 0 ? 1.4 : .75} fill={Object.values(colors)[i % 6]} opacity=".12">
          <animate attributeName="opacity" values=".04;.22;.04" keyTimes="0;.5;1" dur={`${4 + i % 4}s`} begin={`${-i * .4}s`} repeatCount="indefinite" />
        </circle>)}
      </g>
      <g fill={colors.source} opacity=".08">
        <path d="m125 78 6-3 6 3v7l-6 3-6-3Z" />
        <path d="m134 237 8-4 8 4v9l-8 4-8-4Z" />
        <path d="m445 115 4-2 4 2v5l-4 2-4-2Z" />
        <path d="m458 226 4-2 4 2v5l-4 2-4-2Z" />
      </g>
      <g transform="translate(66 160)">
        <Impact at={.55} color={colors.source} />
        <g transform="scale(.68)">
          <g className="flow-source-form">
          <path d="M-32-19 0-38 32-19V19L0 38-32 19Z" fill="url(#flow-source-face)" />
          <path d="M-32-19 0-38 32-19 0 0Z" fill={colors.source} opacity=".2" />
          <path d="M0 0 32-19V19L0 38Z" fill="#000" opacity=".17" />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill={colors.source} opacity=".8" />
          <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#071311" />
        </g>
        </g>
        <text y="43" className="flow-label">TRANSACTION</text>
      </g>
      <g transform="translate(218 160)">
        <Impact at={2} color={colors.source} />
        <g transform="scale(.72)">
        <path d="M-24-14 0-28 24-14V14L0 28-24 14Z" fill="url(#flow-source-face)" />
        <circle r="4" fill={colors.source} />
        <circle cx="10" cy="-9" r="2" fill={colors.source} opacity=".55" />
        <circle cx="12" r="2" fill={colors.source} opacity=".55" />
        <circle cx="10" cy="9" r="2" fill={colors.source} opacity=".55" />
        </g>
      </g>
      <ChainNode x={258} y={38} chain="base" label="BASE" satellite at={3.6} />
      <ChainNode x={258} y={284} chain="sol" label="SOLANA" satellite at={4.8} />
      <AddressNode x={462} y={24} color={colors.base} label="0x…92B1" at={5.7} />
      <AddressNode x={435} y={304} color={colors.sol} label="7m…pQ9" at={7.2} />
      <ChainNode x={390} y={64} chain="eth" label="ETHEREUM" />
      <ChainNode x={390} y={160} chain="bnb" label="BNB CHAIN" />
      <ChainNode x={390} y={256} chain="tron" label="TRON · TRC-20" />
      <AddressNode x={545} y={64} color={colors.eth} label="0x…8A2F" />
      <AddressNode x={515} y={140} color={colors.bnb} label="0x…B7C4" />
      <AddressNode x={562} y={195} color={colors.bnb} label="0x…D9E1" />
      <AddressNode x={545} y={256} color={colors.tron} label="T…K8m2" />
      <Packet path="M218 160 L258 38" start={2.25} end={3.6} color={colors.base} convert />
      <Packet path="M258 38 L462 24" start={3.85} end={5.7} color={colors.base} />
      <Packet path="M218 160 L258 284" start={2.25} end={4.8} color={colors.sol} convert />
      <Packet path="M258 284 L435 304" start={5.05} end={7.2} color={colors.sol} />
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
