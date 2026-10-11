import type { CSSProperties } from "react";

export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const tiles = Array.from({ length: 5 }, (_, row) => row - 2).flatMap((r) =>
  Array.from({ length: 5 }, (_, column) => column - 2)
    .filter((q) => Math.abs(q + r) <= 2)
    .map((q) => ({ q, r, distance: Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) })),
);

// Solid faces, soft shading and CSS motion; this is decorative, not wallet data.
export function BlockchainField() {
  return (
    <div className="blockchain-field solid-field" aria-hidden="true">
      <div className="solid-stage">
        <div className="solid-aura" />
        <div className="solid-shadow" />
        <div className="solid-board">
          {tiles.map(({ q, r, distance }, i) => {
            const tone = distance === 0 ? "mint" : distance === 1 ? (i % 2 ? "jade" : "mint") : "graphite";
            const style = {
              left: `${((230 + (q + r / 2) * 67 - 35) / 460) * 100}%`,
              top: `${((150 + r * 57 - 37) / 320) * 100}%`,
              "--tile-delay": `${-(q + r + 4) * .48}s`,
              "--tile-lift": `${distance === 0 ? -22 : distance === 1 ? -15 : -9}px`,
              zIndex: r + 4,
            } as CSSProperties;
            return (
              <div key={`${q}:${r}`} className={`solid-tile solid-tile-${tone}`} style={style}>
                <svg viewBox="0 0 80 96" fill="none">
                  <defs>
                    <linearGradient id={`tile-top-${i}`} x1="15" y1="3" x2="65" y2="78" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--tile-highlight)" />
                      <stop offset="1" stopColor="var(--tile-color)" />
                    </linearGradient>
                    <linearGradient id={`tile-side-${i}`} x1="7" y1="65" x2="73" y2="92" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--tile-side)" />
                      <stop offset="1" stopColor="var(--tile-depth)" />
                    </linearGradient>
                  </defs>
                  <path d="M7 24 40 5 73 24V73L40 92 7 73Z" fill={`url(#tile-side-${i})`} />
                  <path d="m40 80 33-19v12L40 92Z" fill="var(--tile-depth)" />
                  <path d="M40 4 73 23V61L40 80 7 61V23Z" fill={`url(#tile-top-${i})`} />
                  <path d="m40 4 33 19-33 19L7 23Z" fill="var(--tile-highlight)" opacity=".13" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
      <span className="field-caption mono">MULTI-CHAIN / ONE PERSPECTIVE</span>
    </div>
  );
}
