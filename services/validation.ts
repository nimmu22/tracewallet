/** Public address validation is shared by the form and API; nothing accepts wallet secrets. */
import { isAddress, getAddress } from "viem";
export function addressKind(input: string): "evm" | "solana" | "ens" | null {
  const value = input.trim();
  if (value.length > 255 || /\s/.test(value)) return null;
  // viem enforces EIP-55 for mixed-case addresses; lowercase remains a valid format.
  if (isAddress(value, { strict: true })) return "evm";
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/i.test(value) && !value.includes(".."))
    return "ens";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return null;
  // Base58 length alone accepts malformed keys. A Solana public key must decode to 32 bytes.
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const c of value) n = n * 58n + BigInt(alphabet.indexOf(c));
  let bytes = 0;
  while (n > 0n) {
    bytes++;
    n >>= 8n;
  }
  return bytes + (value.match(/^1*/)?.[0].length ?? 0) === 32 ? "solana" : null;
}
export const canonicalAddress = (address: string) =>
  addressKind(address) === "evm" ? getAddress(address) : address;
