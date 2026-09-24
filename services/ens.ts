/** ENS resolution and forward-verified reverse lookup use Ethereum mainnet. */
import { createPublicClient, http, fallback } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { cached } from "./http";
import { addressKind, canonicalAddress } from "./validation";
const client = createPublicClient({
  chain: mainnet,
  transport: fallback(
    [
      http(
        process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
        { timeout: 6000, retryCount: 0 },
      ),
      http("https://eth.drpc.org", { timeout: 6000, retryCount: 0 }),
    ],
    { retryCount: 0 },
  ),
});
export async function resolveWallet(input: string) {
  const kind = addressKind(input);
  if (!kind)
    throw new Error(
      "Enter a valid public EVM address, Solana address, or .eth name.",
    );
  return cached(`resolve:${input}`, 120000, async () => {
    if (kind === "ens") {
      const name = normalize(input);
      const address = await client.getEnsAddress({ name });
      if (!address) throw new Error("This ENS name has no Ethereum address.");
      return { address, name, kind: "evm" as const };
    }
    const address = canonicalAddress(input);
    let name: string | null = null;
    if (kind === "evm") {
      try {
        const reverse = await client.getEnsName({
          address: address as `0x${string}`,
        });
        if (reverse) {
          const forward = await client.getEnsAddress({
            name: normalize(reverse),
          });
          if (forward?.toLowerCase() === address.toLowerCase()) name = reverse;
        }
      } catch {
        /* An optional ENS lookup must not prevent address analysis. */
      }
    }
    return { address, name, kind };
  });
}
