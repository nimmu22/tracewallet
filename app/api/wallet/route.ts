import { getWalletChain } from "@/services";
import { addressKind } from "@/services/validation";
import { networkById } from "@/services/types";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.trim() ?? "";
  const chain = url.searchParams.get("chain") ?? "";
  const kind = addressKind(address);
  if (
    !networkById(chain) ||
    !kind ||
    kind === "ens" ||
    (kind === "solana") !== (chain === "solana")
  )
    return Response.json(
      { error: "Invalid address or incompatible network." },
      { status: 400 },
    );
  try {
    return Response.json(await getWalletChain(chain, address), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Network data unavailable." },
      { status: 503 },
    );
  }
}
