export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const cycle = "8s";
type Chain = "btc" | "eth" | "bnb" | "tron" | "base" | "sol";

function ChainSymbol({ chain }: { chain: Chain }) {
  if (chain === "btc") return <g fill="currentColor" transform="rotate(12)">
    <path d="M-11-13H0C10-13 13-8 9-2C16 3 12 14 1 14H-11V9H-7V-8H-11ZM-2-8V-2H1C6-2 6-8 1-8ZM-2 2V9H2C8 9 8 2 2 2Z" fillRule="evenodd" />
    <path d="M-3-19H0V-12H-3ZM3-19H6V-12H3ZM-3 13H0V20H-3ZM3 13H6V20H3Z" />
  </g>;
  if (chain === "eth") return <g>
    <path d="M0-20 12 0 0 7-12 0Z" fill="currentColor" />
    <path d="M0-20V7L12 0Z" className="flow-facet" stroke="none" fill="#d7ffcc" opacity=".45" />
    <path d="M0 11 12 4 0 24-12 4Z" fill="currentColor" opacity=".8" />
  </g>;
  if (chain === "bnb") return <g fill="currentColor">
    <path d="m0-21 10 10-5 5-5-5-5 5-5-5ZM-21 0l5-5 5 5-5 5ZM21 0l-5-5-5 5 5 5ZM0 21l10-10-5-5-5 5-5-5-5 5Z" />
    <path d="m0-5 5 5-5 5-5-5Z" />
  </g>;
  if (chain === "base") return <path fill="currentColor" d="M-20-2a20 20 0 1 1 0 4H6V-2Z" />;
  if (chain === "sol") return <path fill="currentColor" d="m-12-16 27 0-6 7h-27Zm-6 13h27l6 7h-27Zm6 13h27l-6 7h-27Z" />;
  return <g fill="currentColor">
    <path d="M-18-17 20-9 1 25Zm5 5L1 17l3-21Z" fillRule="evenodd" />
    <path d="m-13-12 17 8 11-4ZM4-4 1 17 15-8Z" stroke="none" opacity=".35" />
  </g>;
}

function Impact({ at, small = false }: { at: number; small?: boolean }) {
  const start = at / 8;
  const peak = (at + .1) / 8;
  const end = (at + .65) / 8;
  const times = `0;${start};${peak};${end};1`;
  return <g className="flow-impact">
    <ellipse rx="16" ry="16" fill="url(#flow-halo)" opacity="0">
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={times} dur={cycle} repeatCount="indefinite" />
      <animate attributeName="rx" values={small ? "8;8;23;34;34" : "14;14;40;65;65"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
      <animate attributeName="ry" values={small ? "8;8;23;34;34" : "14;14;40;65;65"} keyTimes={times} dur={cycle} repeatCount="indefinite" />
    </ellipse>
    {Array.from({ length: small ? 3 : 7 }, (_, i) => {
      const angle = i * 2.399 + .3;
      const distance = small ? 24 : 42 + (i % 3) * 6;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      return <circle key={i} r={i % 2 ? .8 : 1.3} fill="currentColor" opacity="0">
        <animate attributeName="cx" values={`0;0;${x * .32};${x};${x}`} keyTimes={times} dur={cycle} repeatCount="indefinite" />
        <animate attributeName="cy" values={`0;0;${y * .32};${y};${y}`} keyTimes={times} dur={cycle} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;.8;0;0" keyTimes={times} dur={cycle} repeatCount="indefinite" />
      </circle>;
    })}
  </g>;
}

function ChainNode({ x, y, chain, satellite = false, source = false, at = 4.4 }: { x: number; y: number; chain: Chain; satellite?: boolean; source?: boolean; at?: number }) {
  return <g transform={`translate(${x} ${y})`} className="flow-chain">
    <Impact at={at} small={satellite} />
    <g transform={`scale(${satellite ? .57 : source ? .9 : .78})`}>
      <g className={"flow-glyph" + (source ? " flow-source-form" : "")} filter="url(#flow-neon)">
        <g className="flow-symbols" stroke="#ff334f" strokeWidth="1.3" strokeLinejoin="miter" strokeMiterlimit="4" paintOrder="fill stroke">
          <ChainSymbol chain={chain} />
        </g>
      </g>
    </g>
  </g>;
}

function AddressNode({ x, y, label, at = 6.6 }: { x: number; y: number; label: string; at?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <Impact at={at} small />
    <circle r="12" fill="url(#flow-halo)" opacity=".65" />
    <circle r="2.2" fill="currentColor" filter="url(#flow-neon)" />
    <text y="20" className="flow-address">{label}</text>
  </g>;
}

function Packet({ path, start, end }: { path: string; start: number; end: number }) {
  const a = start / 8;
  const b = end / 8;
  return <g className="flow-particle" opacity="0" fill="currentColor">
    <animateMotion path={path} rotate="auto" calcMode="linear" keyPoints="0;0;1;1" keyTimes={`0;${a};${b};1`} dur={cycle} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;1;0;0" keyTimes={`0;${a};${b};1`} calcMode="discrete" dur={cycle} repeatCount="indefinite" />
    <circle r="15" fill="url(#flow-halo)" />
    {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={-(i + 1) * 5} r={1.7 - i * .3} opacity={.4 - i * .08} />)}
    <circle r="2.2" filter="url(#flow-neon)" />
    <circle r=".8" className="flow-core" fill="#e9ffe3" />
  </g>;
}

// Theme-aware decorative flow; Bitcoin/TRON logos do not add wallet-scanning support.
// The motion paths are invisible. Only logos, address points and packets are drawn.
export function BlockchainField() {
  return <div className="blockchain-field flow-field" aria-hidden="true">
    <svg viewBox="0 0 600 340" fill="none" className="flow-stage">
      <defs>
        <filter id="flow-neon" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".9" result="soft-edge" />
          <feFlood className="flow-bloom" floodColor="#39ff14" floodOpacity=".45" result="green" />
          <feComposite in="green" in2="soft-edge" operator="in" result="bloom" />
          <feMerge><feMergeNode in="bloom" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="flow-halo">
          <stop stopColor="currentColor" stopOpacity=".3" />
          <stop offset=".42" stopColor="currentColor" stopOpacity=".075" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flow-ambient">
          <stop stopColor="currentColor" stopOpacity=".045" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="300" cy="160" rx="260" ry="160" fill="url(#flow-ambient)" />
      <g className="flow-dust">
        {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={95 + (i * 71) % 460} cy={18 + (i * 47) % 286} r={i % 4 === 0 ? 1.2 : .65} fill="currentColor" opacity=".1">
          <animate attributeName="opacity" values=".025;.16;.025" keyTimes="0;.5;1" dur={`${4 + i % 4}s`} begin={`${-i * .4}s`} repeatCount="indefinite" />
        </circle>)}
      </g>
      <ChainNode x={66} y={160} chain="btc" source at={.55} />
      <g transform="translate(218 160)">
        <Impact at={2} />
        <circle r="17" fill="url(#flow-halo)" opacity=".45" />
        <circle r="2.6" fill="currentColor" filter="url(#flow-neon)" />
      </g>
      <ChainNode x={258} y={38} chain="base" satellite at={3.6} />
      <ChainNode x={258} y={284} chain="sol" satellite at={4.8} />
      <ChainNode x={390} y={64} chain="eth" />
      <ChainNode x={390} y={160} chain="bnb" />
      <ChainNode x={390} y={256} chain="tron" />
      <AddressNode x={462} y={24} label="0x…92B1" at={5.7} />
      <AddressNode x={435} y={304} label="7m…pQ9" at={7.2} />
      <AddressNode x={545} y={64} label="0x…8A2F" />
      <AddressNode x={515} y={140} label="0x…B7C4" />
      <AddressNode x={562} y={195} label="0x…D9E1" />
      <AddressNode x={545} y={256} label="T…K8m2" />
      <Packet path="M66 160 L218 160" start={.6} end={2} />
      <Packet path="M218 160 L258 38" start={2.25} end={3.6} />
      <Packet path="M258 38 L462 24" start={3.85} end={5.7} />
      <Packet path="M218 160 L258 284" start={2.25} end={4.8} />
      <Packet path="M258 284 L435 304" start={5.05} end={7.2} />
      <Packet path="M218 160 L390 64" start={2.25} end={4.4} />
      <Packet path="M218 160 L390 160" start={2.25} end={4.4} />
      <Packet path="M218 160 L390 256" start={2.25} end={4.4} />
      <Packet path="M390 64 L545 64" start={4.7} end={6.6} />
      <Packet path="M390 160 L515 140" start={4.7} end={6.6} />
      <Packet path="M390 160 L562 195" start={4.7} end={6.6} />
      <Packet path="M390 256 L545 256" start={4.7} end={6.6} />
    </svg>
    <span className="field-caption mono">ILLUSTRATIVE MULTICHAIN FLOW</span>
  </div>;
}
