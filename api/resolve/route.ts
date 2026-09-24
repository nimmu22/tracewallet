import { resolveWallet } from "@/services/ens";
import { addressKind } from "@/services/validation";
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("address")?.trim() ?? "";
  if (!addressKind(input))
    return Response.json(
      {
        error:
          "Enter a valid public EVM address, Solana address, or .eth name.",
      },
      { status: 400 },
    );
  try {
    return Response.json(await resolveWallet(input), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && e.message.includes("no Ethereum")
            ? e.message
            : "ENS lookup unavailable. Try the public address directly.",
      },
      { status: 503 },
    );
  }
}
