# Celo Impact Jar

MiniPay-compatible Celo mini app for community impact jars and stablecoin micro-donations.

## Live

- **App:** http://43.153.202.101
- **Contract:** [0xf2b690a0b0cab089ccb84beec5b40afcb9661040](https://celoscan.io/address/0xf2b690a0b0cab089ccb84beec5b40afcb9661040)
- **Network:** Celo Mainnet (Chain ID 42220)

## What is this?

A simple mini app that lets communities create stablecoin donation jars on Celo. Each donation is recorded onchain, making micro-support transparent and mobile-friendly.

Use cases:
- Local food aid
- School supplies
- Creator support
- Community public goods

## Features

- **MiniPay compatible** — detects `window.ethereum.isMiniPay` and hides wallet-connect friction
- **Onchain transparency** — every donation emits a public event on Celo mainnet
- **Stablecoin native** — uses USDm (`0x765DE816845861e75A25fCA122bb6898B8B1282a`) by default
- **Mobile first** — designed for MiniPay's 14M+ global users
- **Open source** — fully transparent, MIT licensed

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Smart Contract:** Solidity 0.8.24
- **Chain:** Celo Mainnet
- **Wallet:** MiniPay / any injected EVM wallet (viem)

## Quick Start

```bash
git clone https://github.com/ulsreall/celo-impact-jar.git
cd celo-impact-jar
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploy Contract

```bash
cp .env.example .env
# Edit .env with your private key
npm run compile
npx hardhat run scripts/deploy.ts --network celo
npx hardhat verify --network celo <CONTRACT_ADDRESS> 0x765DE816845861e75A25fCA122bb6898B8B1282a
```

## Smart Contract

`ImpactJar.sol` on Celo Mainnet:

- `createCampaign(name, description, recipient)` — create a new donation jar (owner only)
- `donate(campaignId, token, amount, note)` — send stablecoin to a jar
- `withdraw(campaignId, token, amount)` — withdraw funds to recipient
- `setSupportedToken(token, supported)` — add/remove supported tokens (owner only)

Events: `CampaignCreated`, `Donated`, `Withdrawn`

## MiniPay Integration

```js
if (window.ethereum && window.ethereum.isMiniPay) {
  setHideConnectBtn(true);
  connect({ connector: injected({ target: "metaMask" }) });
}
```

## Roadmap

- [ ] Campaign creation UI for project owner
- [ ] Event indexer for public donation history
- [ ] Claim/withdraw dashboard for campaign recipients
- [ ] AI helper for campaign pitch generation
- [ ] Multi-token support (cUSD, USDC, USDT)

## Safety

- No seed phrases or private keys collected
- No custody of user wallets
- All donations are manual wallet transactions

## Links

- [Celo Docs](https://docs.celo.org)
- [MiniPay Quickstart](https://docs.celo.org/build-on-celo/build-on-minipay/quickstart)
- [Proof of Ship](https://talent.app/~/earn/celo-proof-of-ship)
- [Celoscan](https://celoscan.io)

## License

MIT
