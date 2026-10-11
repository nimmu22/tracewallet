export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function polygon(sides: number, radius: number, cx = 230, cy = 150) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}
const hexagon = polygon(6, 70);
const innerRing = polygon(6, 98);
const octagon = polygon(8, 132);
const meshCells = [
  [45, 92], [77, 110], [45, 128], [13, 110], [77, 146], [45, 164],
  [415, 136], [383, 154], [415, 172], [447, 154], [383, 190], [415, 208],
];

// Decorative geometry only. CSS animates HTML wrappers without per-frame React renders.
export function BlockchainField() {
  return (
    <div className="blockchain-field polygon-field" aria-hidden="true">
      <div className="polygon-stage">
        <svg viewBox="0 0 460 300" fill="none" className="polygon-backdrop">
          <g stroke="var(--primary)" strokeWidth=".8" opacity=".12">
            {meshCells.map(([x, y]) => <polygon key={`${x}-${y}`} points={polygon(6, 20, x, y)} />)}
            <path d="M18 150h120m184 0h120M230 8v18m0 248v18" strokeDasharray="2 6" />
          </g>
          <g stroke="var(--primary)" strokeWidth="1" opacity=".22">
            <path d="m82 65 64 36m-64 134 64-36m232-134-64 36m64 134-64-36" />
          </g>
          <g fill="var(--muted-foreground)" fontFamily="monospace" fontSize="9" letterSpacing="2">
            <text x="46" y="55">ETH</text><text x="24" y="253">BASE</text>
            <text x="384" y="55">SOL</text><text x="384" y="253">BNB</text>
          </g>
          <g fill="var(--primary)">
            <circle cx="82" cy="65" r="2" /><circle cx="82" cy="235" r="2" />
            <circle cx="378" cy="65" r="2" /><circle cx="378" cy="235" r="2" />
          </g>
        </svg>
        <div className="polygon-layer polygon-orbit-outer">
          <svg viewBox="0 0 460 300" fill="none">
            <polygon points={octagon} stroke="var(--primary)" strokeOpacity=".25" strokeWidth="1" />
            <polygon className="polygon-tracer" points={octagon} stroke="var(--primary)" strokeWidth="2" pathLength="100" strokeDasharray="5 45" />
            <g fill="var(--primary)">
              <circle cx="230" cy="18" r="3" /><circle cx="230" cy="282" r="3" />
            </g>
          </svg>
        </div>
        <div className="polygon-layer polygon-orbit-inner">
          <svg viewBox="0 0 460 300" fill="none">
            <polygon points={innerRing} stroke="var(--primary)" strokeOpacity=".45" strokeWidth="1" strokeDasharray="4 8" />
            <polygon className="polygon-tracer polygon-tracer-reverse" points={innerRing} stroke="var(--primary)" strokeOpacity=".75" strokeWidth="1.5" pathLength="100" strokeDasharray="3 30" />
          </svg>
        </div>
        <div className="polygon-layer polygon-core">
          <svg viewBox="0 0 460 300" fill="none">
            <polygon points={hexagon} fill="var(--card)" stroke="var(--primary)" strokeWidth="1.6" />
            <polygon points={polygon(6, 60)} stroke="var(--primary)" strokeOpacity=".2" strokeWidth=".8" />
            <path d="m209 133-13 8v17l13 8 14-8v-17Zm42 0-14 8v17l14 8 13-8v-17Zm-30 17h18" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
            <text x="230" y="189" textAnchor="middle" fill="var(--muted-foreground)" fontFamily="monospace" fontSize="7" letterSpacing="2.5">CHAINTRACE</text>
          </svg>
        </div>
      </div>
      <span className="field-caption mono">MULTI-CHAIN / ONE PERSPECTIVE</span>
    </div>
  );
}
