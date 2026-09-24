"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { type WalletTransaction } from "@/services/types";
export function ActivityChart({
  transactions,
  range,
}: {
  transactions: WalletTransaction[];
  range: string;
}) {
  const now = Date.now(),
    days = (
      { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as Record<string, number>
    )[range];
  const monthly = range === "ALL" || range === "1Y";
  const dated = transactions.filter(
    (t) =>
      t.timestamp &&
      (!days || Date.parse(t.timestamp) >= now - days * 86400000),
  );
  const groups: Record<string, number> = {};
  for (const t of dated) {
    const key = t.timestamp!.slice(0, monthly ? 7 : 10);
    groups[key] = (groups[key] ?? 0) + 1;
  }
  // Do not invent zero-filled gaps: a bounded provider response may omit activity in those periods.
  const data = Object.keys(groups)
    .sort()
    .map((date) => ({ date, transactions: groups[date] }));
  if (!data.length)
    return (
      <div className="chart-empty">
        <h3>No transactions in this period</h3>
        <p>Choose a wider range. History may be partial.</p>
      </div>
    );
  return (
    <div
      className="activity-chart"
      role="img"
      aria-label={`${data.length} time periods containing ${dated.length} loaded transactions`}
    >
      <ResponsiveContainer width="100%" height={228}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 14, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={35}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(s) =>
              new Date(s).toLocaleDateString("en-US", {
                month: "short",
                ...(monthly ? { year: "2-digit" } : { day: "numeric" }),
              })
            }
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="transactions"
            fill="#6388ef"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function GasChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={49}
          outerRadius={65}
          paddingAngle={3}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [
            "$" + Number(v).toFixed(2),
            "Current-price estimate",
          ]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            fontSize: 12,
            color: "var(--foreground)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
