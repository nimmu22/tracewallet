import { getMarket } from "@/services/prices";
export async function GET() {
  try {
    return Response.json(await getMarket(), {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
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
