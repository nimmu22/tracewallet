import { chainLogos } from "./chain-logos";

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
  // Embed the original assets so the standalone preview also works offline.
  return <image href={chainLogos[chain]} x="-21" y="-21" width="42" height="42" preserveAspectRatio="xMidYMid meet" />;
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
    <rect className="flow-node-frame" x="-27" y="-27" width="54" height="54" rx="4" />
    <Impact at={at} small={satellite} />
    <g transform={`scale(${satellite ? .7 : source ? 1 : .85})`}>
      <g className={"flow-glyph" + (source ? " flow-source-form" : "")}>
        <ChainSymbol chain={chain} />
      </g>
    </g>
  </g>;
}

function AddressNode({ x, y, label, at = 6.6 }: { x: number; y: number; label: string; at?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect className="flow-node-frame" x="-34" y="-12" width="68" height="42" rx="4" />
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

function RelayNode({ x, y, at }: { x: number; y: number; at: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <Impact at={at} small />
    <circle r="11" fill="url(#flow-halo)" />
    <circle r="2.4" fill="currentColor" filter="url(#flow-neon)" />
  </g>;
}

type Point = readonly [number, number];
// Rounded right-angle trajectories shared by the connectors and moving packets.
function route(points: readonly Point[]) {
  let path = `M${points[0].join(" ")}`;
  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1], corner = points[i], next = points[i + 1];
    const incoming = Math.hypot(corner[0] - previous[0], corner[1] - previous[1]);
    const outgoing = Math.hypot(next[0] - corner[0], next[1] - corner[1]);
    const radius = Math.min(10, incoming / 2, outgoing / 2);
    if (!incoming || !outgoing) continue;
    const before = [corner[0] + (previous[0] - corner[0]) * radius / incoming, corner[1] + (previous[1] - corner[1]) * radius / incoming];
    const after = [corner[0] + (next[0] - corner[0]) * radius / outgoing, corner[1] + (next[1] - corner[1]) * radius / outgoing];
    path += ` L${before.join(" ")} Q${corner.join(" ")} ${after.join(" ")}`;
  }
  return path + ` L${points.at(-1)!.join(" ")}`;
}
const chainNodes: { x: number; y: number; chain: Chain; at: number; satellite?: boolean; source?: boolean }[] = [
  { x: 52, y: 180, chain: "btc", at: .55, source: true },
  { x: 178, y: 88, chain: "eth", at: 2 },
  { x: 178, y: 274, chain: "sol", at: 2 },
  { x: 326, y: 38, chain: "base", at: 3.15, satellite: true },
  { x: 326, y: 108, chain: "bnb", at: 3.35, satellite: true },
  { x: 326, y: 178, chain: "eth", at: 3.6, satellite: true },
  { x: 326, y: 248, chain: "tron", at: 3.45, satellite: true },
  { x: 326, y: 318, chain: "bnb", at: 3.8, satellite: true },
];
const addresses = [
  { x: 444, y: 38, label: "0x…92B1", at: 4.35 },
  { x: 444, y: 108, label: "0x…B7C4", at: 4.65 },
  { x: 444, y: 178, label: "0x…D9E1", at: 4.95 },
  { x: 444, y: 248, label: "T…K8m2", at: 5.25 },
  { x: 444, y: 318, label: "0x…4F9A", at: 5.65 },
  { x: 586, y: 36, label: "0x…8A2F", at: 6.65 },
  { x: 586, y: 114, label: "0x…E4C7", at: 6.95 },
  { x: 586, y: 184, label: "0x…67C1", at: 6.65 },
  { x: 586, y: 254, label: "T…m9dA", at: 7.15 },
  { x: 586, y: 326, label: "0x…A01D", at: 7.3 },
];
const journeys: { points: Point[]; start: number; end: number }[] = [
  { points: [[52,180],[112,180],[112,88],[178,88]], start: .65, end: 2 },
  { points: [[52,180],[112,180],[112,274],[178,274]], start: .65, end: 2 },
  { points: [[178,88],[248,88],[248,38],[326,38]], start: 2.2, end: 3.15 },
  { points: [[178,88],[270,88],[270,108],[326,108]], start: 2.2, end: 3.35 },
  { points: [[178,88],[226,88],[226,178],[326,178]], start: 2.2, end: 3.6 },
  { points: [[178,274],[254,274],[254,248],[326,248]], start: 2.2, end: 3.45 },
  { points: [[178,274],[236,274],[236,318],[326,318]], start: 2.2, end: 3.8 },
  { points: [[326,38],[444,38]], start: 3.4, end: 4.35 },
  { points: [[326,108],[444,108]], start: 3.6, end: 4.65 },
  { points: [[326,178],[444,178]], start: 3.85, end: 4.95 },
  { points: [[326,248],[444,248]], start: 3.7, end: 5.25 },
  { points: [[326,318],[444,318]], start: 4.05, end: 5.65 },
  { points: [[444,38],[478,38],[478,78],[508,78]], start: 4.65, end: 5.55 },
  { points: [[444,108],[486,108],[486,78],[508,78]], start: 4.85, end: 5.55 },
  { points: [[508,78],[546,78],[546,36],[586,36]], start: 5.75, end: 6.65 },
  { points: [[508,78],[538,78],[538,114],[586,114]], start: 5.75, end: 6.95 },
  { points: [[444,178],[520,178],[520,184],[586,184]], start: 5.15, end: 6.65 },
  { points: [[444,248],[480,248],[480,284],[508,284]], start: 5.65, end: 6.1 },
  { points: [[444,318],[478,318],[478,284],[508,284]], start: 5.8, end: 6.25 },
  { points: [[508,284],[548,284],[548,254],[586,254]], start: 6.45, end: 7.15 },
  { points: [[508,284],[538,284],[538,326],[586,326]], start: 6.45, end: 7.3 },
];

// Spread node positions, rather than stretching the logo artwork or packet shapes.
const wideX = (x: number) => Math.round(20 + (x - 20) * 1.78);
const wideChainNodes = chainNodes.map(node => ({ ...node, x: wideX(node.x) }));
const wideAddresses = addresses.map(node => ({ ...node, x: wideX(node.x) }));
const wideJourneys = journeys.map(journey => ({
  ...journey,
  points: journey.points.map(([x, y]): Point => [wideX(x), y]),
}));

// Theme-aware decorative flow; Bitcoin/TRON logos do not add wallet-scanning support.
// Connectors sit behind the nodes; masks keep lines out of logos and address points.
export function BlockchainField({ background = false }: { background?: boolean }) {
  const nodes = background ? wideChainNodes : chainNodes;
  const wallets = background ? wideAddresses : addresses;
  const routes = background ? wideJourneys : journeys;
  const width = background ? 1120 : 640;
  const relayX = background ? wideX(508) : 508;
  return <div className={"blockchain-field flow-field" + (background ? " flow-background" : "")} aria-hidden="true">
    <svg viewBox={`0 0 ${width} 360`} fill="none" className="flow-stage">
      <defs>
        <mask id="flow-route-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height="360">
          <rect width={width} height="360" fill="white" />
          {nodes.map(node => <g key={`${node.x}-${node.y}`} transform={`translate(${node.x} ${node.y})`}>
            <circle r={node.source ? 24 : node.satellite ? 16 : 22} fill="black" />
            <rect className="flow-block-cutout" x="-28" y="-28" width="56" height="56" rx="4" fill="black" />
          </g>)}
          {wallets.map(node => <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
            <circle r="6" fill="black" />
            <rect className="flow-block-cutout" x="-35" y="-13" width="70" height="44" rx="4" fill="black" />
          </g>)}
          <circle cx={relayX} cy="78" r="6" fill="black" />
          <circle cx={relayX} cy="284" r="6" fill="black" />
        </mask>
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
      <ellipse cx={width / 2} cy="180" rx={width * .44} ry="165" fill="url(#flow-ambient)" />
      <g className="flow-dust">
        {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={background ? wideX(95 + (i * 71) % 460) : 95 + (i * 71) % 460} cy={18 + (i * 47) % 286} r={i % 4 === 0 ? 1.2 : .65} fill="currentColor" opacity=".1">
          <animate attributeName="opacity" values=".025;.16;.025" keyTimes="0;.5;1" dur={`${4 + i % 4}s`} begin={`${-i * .4}s`} repeatCount="indefinite" />
        </circle>)}
      </g>
      <g className="flow-routes" mask="url(#flow-route-mask)">
        {routes.map((journey, i) => <path key={i} d={route(journey.points)} />)}
      </g>
      {nodes.map(node => <ChainNode key={`${node.x}-${node.y}`} {...node} />)}
      {wallets.map(node => <AddressNode key={node.label} {...node} />)}
      <RelayNode x={relayX} y={78} at={5.55} />
      <RelayNode x={relayX} y={284} at={6.25} />
      {routes.map((journey, i) => <Packet key={i} path={route(journey.points)} start={journey.start} end={journey.end} />)}
    </svg>
    <span className="field-caption mono">ILLUSTRATIVE MULTICHAIN FLOW</span>
  </div>;
}
