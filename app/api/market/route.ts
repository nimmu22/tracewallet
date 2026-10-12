import { getMarket } from "@/services/prices";
export async function GET() {
  try {
    return Response.json(await getMarket(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.warn(
      "Market provider:",
      e instanceof Error ? e.message : "Unknown error",
    );
    return Response.json(
      {
        error:
          "Market prices are temporarily unavailable. Retrying automatically.",
      },
      { status: 503 },
    );
  }
}
