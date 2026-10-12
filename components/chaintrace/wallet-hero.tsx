import { Layers3, ShieldCheck } from "lucide-react";
import { memo } from "react";
import { BlockchainField } from "./blockchain-field";

export function WalletHero() {
  return <section className="wallet-intro">
    <div className="intro-copy">
      <h1>Follow the wallet. <span>See the chain.</span></h1>
      <p>Public wallet activity, network history and gas spending.</p>
    </div>
    <div className="hero-signals">
      <span><Layers3 size={13} /> EVM + Solana</span>
      <span><ShieldCheck size={13} /> Read-only by design</span>
    </div>
  </section>;
}

export const WalletBackground = memo(function WalletBackground() {
  return <div className="wallet-background" aria-hidden="true">
    <BlockchainField background fullPage nodeStyle="blocks" />
  </div>;
});
