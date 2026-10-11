export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!databaseUrl || !token) {
    return Response.json(
      { error: "Counter database is not configured." },
      { status: 503 },
    );
  }
  try {
    const endpoint = new URL(databaseUrl.replace(/^libsql:\/\//, "https://"));
    if (endpoint.protocol !== "https:") throw new Error("Invalid database URL");
    endpoint.pathname = "/v2/pipeline";
    endpoint.search = "";
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: {
              sql: "CREATE TABLE IF NOT EXISTS tracewallet_page_views (id INTEGER PRIMARY KEY CHECK (id = 1), total INTEGER NOT NULL DEFAULT 0)",
            },
          },
          {
            type: "execute",
            stmt: {
              sql: "INSERT INTO tracewallet_page_views (id, total) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total = total + 1 RETURNING total",
              want_rows: true,
            },
          },
          { type: "close" },
        ],
      }),
    });
    if (!response.ok) throw new Error("Database unavailable");
    const data = await response.json();
    if (data.results?.some((r: { type: string }) => r.type === "error"))
      throw new Error("Query failed");
    const value = data.results?.[1]?.response?.result?.rows?.[0]?.[0]?.value;
    const total = Number(value);
    if (value == null || !Number.isSafeInteger(total) || total < 1)
      throw new Error("Invalid count");
    return Response.json(
      { total },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Counter temporarily unavailable." },
      { status: 503 },
    );
  }
}
