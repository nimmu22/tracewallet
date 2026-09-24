"use client";
import { useState, useEffect, memo } from "react";
import { AudioLines } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// Isolate the second-by-second clock so it does not redraw the market table or charts.
export const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="clock mono">
      <span>
        {now
          ?.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
          .toUpperCase() ?? "LOCAL TIME"}
      </span>
      <b>{now?.toLocaleTimeString("en-US") ?? "—"}</b>
    </div>
  );
});
export function Opening() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    try {
      if (sessionStorage.getItem("chaintrace-intro")) return;
      sessionStorage.setItem("chaintrace-intro", "seen");
    } catch {}
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="opening"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 400 190" className="intro-network">
            {[
              [65, 40],
              [118, 150],
              [200, 18],
              [280, 145],
              [337, 42],
            ].map(([x, y], i) => (
              <motion.g
                key={x}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [0, 0, 200 - x],
                  y: [0, 0, 90 - y],
                }}
                transition={{ duration: 1.5, delay: i * 0.06 }}
              >
                <motion.line
                  x1={200}
                  y1={90}
                  x2={x}
                  y2={y}
                  stroke="#40506d"
                  strokeWidth={1}
                />
                <rect x={x - 3} y={y - 3} width={6} height={6} fill="#799cff" />
              </motion.g>
            ))}
            <motion.circle
              cx={200}
              cy={90}
              r={3}
              fill="#8babff"
              animate={{ scale: [0, 1, 1, 0] }}
              transition={{ duration: 1.8 }}
            />
          </svg>
          <motion.div
            className="intro-brand"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <AudioLines />
            <span>CHAINTRACE</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            Explore the story behind a wallet.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
