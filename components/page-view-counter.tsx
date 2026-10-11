"use client";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
// One request per document load. Strict Mode mounts share it; a refresh records again.
let pageViewRequest: Promise<number> | undefined;
function recordPageView() {
  return (pageViewRequest ??= fetch("/api/views", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    signal: AbortSignal.timeout(12000),
  }).then(async (response) => {
    if (!response.ok) throw new Error("Counter unavailable");
    const data = await response.json();
    if (!Number.isSafeInteger(data.total) || data.total < 1) throw new Error("Invalid count");
    return data.total as number;
  }));
}
export default function PageViewCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    recordPageView().then((value) => { if (active) setTotal(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const display = total !== null ? total.toLocaleString("en-IN") : failed ? "Unavailable" : "…";
  return (
    <div className={`views-badge${failed ? " counter-failed" : ""}`} role="status"
      aria-label={`Total page views: ${display}`}
      title="Total page views. Repeat visits and refreshes are counted.">
      <Eye size={16} aria-hidden="true" /><span>Total views</span><strong>{display}</strong>
    </div>
  );
}
