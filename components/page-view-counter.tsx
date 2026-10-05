"use client";

import { useEffect, useState } from "react";

// Reuse the request during React development checks. A refresh starts a new request.
let pageViewRequest: Promise<number> | undefined;
function recordPageView() {
  if (!pageViewRequest) {
    pageViewRequest = fetch("/api/views", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Counter unavailable");
      const data = await response.json();
      if (!Number.isSafeInteger(data.total) || data.total < 1)
        throw new Error("Invalid count");
      return data.total as number;
    });
  }
  return pageViewRequest;
}

export default function PageViewCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    recordPageView()
      .then((value) => {
        if (active) setTotal(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="views-bar">
      <div className="views-badge" role="status">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Total views</span>
        <strong>
          {total !== null
            ? total.toLocaleString("en-IN")
            : failed
              ? "Unavailable"
              : "…"}
        </strong>
      </div>
      <style jsx>{`
        .views-bar {
          display: flex;
          justify-content: flex-end;
          padding: 12px clamp(16px, 4vw, 48px);
          color: inherit;
        }
        .views-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 14px;
          border: 1px solid rgba(128, 128, 128, 0.25);
          border-radius: 999px;
          background: rgba(128, 128, 128, 0.06);
          font-size: 12px;
          line-height: 1.4;
        }
        .views-badge svg {
          color: #60a5fa;
        }
        .views-badge strong {
          padding-left: 10px;
          border-left: 1px solid rgba(128, 128, 128, 0.25);
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
