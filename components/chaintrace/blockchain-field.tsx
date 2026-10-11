export function ChainMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 12 7v14l-12 7L4 23V9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 9 12 7 12-7M16 16v14M10 6l12 7v7l-6 3-6-3v-7l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

// A lightweight decorative network. It represents no wallet data or fund flows.
export function BlockchainField() {
  return (
    <div className="blockchain-field" aria-hidden="true">
      <svg viewBox="0 0 460 300" fill="none">
        <defs>
          <linearGradient id="chain-line" x1="20" y1="20" x2="430" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary)" stopOpacity=".12" />
            <stop offset=".5" stopColor="var(--primary)" stopOpacity=".7" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <g stroke="var(--primary)" opacity=".09">
          <ellipse cx="238" cy="150" rx="195" ry="104" />
          <ellipse cx="238" cy="150" rx="155" ry="80" />
          <path d="M20 150h430M238 20v260" strokeDasharray="3 8" />
        </g>
        <g stroke="url(#chain-line)" strokeWidth="1.2">
          <path d="m238 150-126-75-63 82 98 73 91-80 114 75 64-94-99-71-79 90" />
          <path d="m112 75 205-15 35 165-205 5-35-155M49 157l367-26" opacity=".45" />
        </g>
        <g className="field-core" stroke="var(--primary)" strokeWidth="1.5">
          <path d="m238 91 51 30v58l-51 30-51-30v-58Z" fill="var(--card)" />
          <path d="m187 121 51 30 51-30M238 151v58m-34-98 51 30v28l-17 10-17-10v-28l17-10" />
          <circle cx="238" cy="151" r="77" strokeDasharray="2 9" opacity=".3" />
        </g>
        {[[112,75],[49,157],[147,230],[352,225],[416,131],[317,60]].map(([x,y], i) => (
          <g key={x} className={`field-node field-node-${i}`}>
            <rect x={x-7} y={y-7} width="14" height="14" rx="3" fill="var(--card)" stroke="var(--primary)" strokeOpacity=".6" />
            <circle cx={x} cy={y} r="2" fill="var(--primary)" />
          </g>
        ))}
        <g fill="var(--muted-foreground)" fontFamily="monospace" fontSize="10" letterSpacing="2">
          <text x="82" y="53">ETH</text><text x="17" y="188">BASE</text>
          <text x="120" y="260">ARB</text><text x="335" y="253">SOL</text>
          <text x="391" y="109">BNB</text><text x="302" y="38">OP</text>
        </g>
      </svg>
      <span className="field-caption mono">MULTI-CHAIN / ONE PERSPECTIVE</span>
    </div>
  );
}
