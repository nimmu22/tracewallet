import { BlockchainField } from "./blockchain-field";

export function WalletHero() {
  return (
    <section className="wallet-intro">
      <div className="intro-copy">
        <h1>Follow the wallet.<span>See the chain.</span></h1>
        <p>Public wallet activity, network history and gas spending.</p>
      </div>
      <div className="header-flow" aria-hidden="true">
        <BlockchainField background twoSided nodeStyle="logos" />
      </div>
    </section>
  );
}
