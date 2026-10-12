import { Layers3, ShieldCheck } from "lucide-react";
import { BlockchainField } from "./blockchain-field";

export function WalletHero() {
  return <div className="page-heading hero-backdrop">
    <div className="hero-copy">
      <div className="eyebrow">ON-CHAIN EXPLORER</div>
      <h1>Follow the wallet.<br /><span>See the chain.</span></h1>
      <p>Public wallet activity, network history and gas spending.<br className="hero-break" /> One address. A clearer view of the blockchain.</p>
      <div className="hero-signals">
        <span><Layers3 size={13} /> EVM + Solana</span>
        <span><ShieldCheck size={13} /> Read-only by design</span>
      </div>
    </div>
    <BlockchainField background />
  </div>;
}
