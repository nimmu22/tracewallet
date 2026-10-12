# Chain logo sources

Original asset files, downloaded on 2026-10-12. Artwork and colours are unchanged.

| File | Source |
| --- | --- |
| btc.svg | https://raw.githubusercontent.com/bitpay/bitcoin-brand/master/bitcoin.svg |
| eth.png | https://raw.githubusercontent.com/ethereum/ethereum-org-website/dev/public/images/eth-logo-grey.png |
| bnb.svg | https://docs.bnbchain.org/assets/bnb.svg |
| tron.png | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png (wallet asset collection) |
| base.svg | https://raw.githubusercontent.com/base/brand-kit/main/logo/TheSquare/Digital/Base_square_blue.svg |
| sol.svg | https://solana.com/src/img/branding/solanaLogoMark.svg |

Run `node scripts/embed-chain-logos.mjs` after replacing an asset, then `node --import tsx scripts/render-flow-preview.mjs` to refresh the standalone preview. Embedding keeps the animation independent of external image hosts. Logos have no colour filters, neon recolouring or added outlines; effects belong to the surrounding transaction flow.
