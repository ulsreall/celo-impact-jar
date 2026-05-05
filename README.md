# KindJar

**Small giving, real local impact — powered by Celo.**

A MiniPay-compatible micro-donation dApp for local impact campaigns on Celo. Users can support community jars with stablecoins, while the built-in AI Agent helps donors understand campaign signals, safety, and donation flow.

**Live app:** https://celo-impact-jar.vercel.app/  
**Contract:** [`0xf2b690a0b0cab089ccb84beec5b40afcb9661040`](https://celoscan.io/address/0xf2b690a0b0cab089ccb84beec5b40afcb9661040)  
**Network:** Celo Mainnet `42220`

## Why this exists

KindJar is designed for the Celo Proof of Ship builder program: practical, mobile-first, stablecoin payments for real people and local communities.

Example use cases:

- community food support
- school supplies
- creator/community public goods
- local emergency jars
- transparent micro-grants

## Features

- **MiniPay-ready UX** — detects `window.ethereum.isMiniPay` and works with injected Celo wallets.
- **Stablecoin donations** — supports USDm/cUSD-style ERC-20 donations on Celo.
- **Onchain transparency** — donation totals and events are verifiable on Celoscan.
- **AI Agent layer** — campaign scoring, donation guidance, jar recommendations, and safety explanations.
- **Self-custody** — users approve and sign every transaction; no seed phrase or private key collection.
- **Open source** — MIT licensed frontend + Solidity contract source.

## AI Agent

The app includes a client-side AI-style agent built for Proof of Ship's AI Agent category. It does not require API keys or hidden backend secrets.

Current agent capabilities:

- ranks campaigns using public campaign data and donation totals
- recommends the best jar to support
- explains whether the app is safe to use
- guides users through the MiniPay/Celo donation flow
- educates users about Celo, stablecoins, and onchain verification

## Tech stack

- **Frontend:** React, Vite, TypeScript
- **Wallet / Chain:** viem, Celo mainnet
- **Smart contract:** Solidity `0.8.24`
- **Hosting:** Vercel
- **License:** MIT

## Repository structure

```text
src/                    React frontend
  AgentChat.tsx         Floating AI Agent chat widget
  AgentInsights.tsx     Campaign intelligence dashboard
  agent.ts              Rules-based AI agent engine
  abi.ts                Contract ABIs
  main.tsx              Main app
  styles.css            UI styles
contracts/              Solidity contract source
scripts/                Local deployment scripts
index.html              Vite entry
vercel.json             Vercel build settings
.env.example            Safe environment variable template
```

## What should NOT be committed

Do **not** upload these to GitHub:

- `node_modules/`
- `dist/`
- `.env` or any real private key
- `artifacts/`, `cache/`, `typechain-types/`
- ZIP files and temporary folders

These are already covered in `.gitignore`.

## Local development

```bash
git clone https://github.com/ulsreall/celo-impact-jar.git
cd celo-impact-jar
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production build

```bash
npm run build
```

Vercel settings:

- Framework: Vite
- Build command: `vite build`
- Output directory: `dist`
- Node.js Version: `20.x`

Required environment variables:

```bash
VITE_IMPACT_JAR_ADDRESS=0xf2b690a0b0cab089ccb84beec5b40afcb9661040
VITE_DEFAULT_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
```

## Contract notes

`contracts/ImpactJar.sol` includes:

- `createCampaign(name, description, recipient)`
- `donate(campaignId, token, amount, note)`
- `withdraw(campaignId, token, amount)`
- `setSupportedToken(token, supported)`

Deployment scripts are included for transparency, but contract deployment should be done locally or from a secure machine. Never put a real private key in GitHub or Vercel.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Security

See [`SECURITY.md`](./SECURITY.md).

## Links

- [Celo Docs](https://docs.celo.org)
- [MiniPay Quickstart](https://docs.celo.org/build-on-celo/build-on-minipay/quickstart)
- [Celo Proof of Ship](https://talent.app/~/earn/celo-proof-of-ship)
- [Celoscan](https://celoscan.io)

## License

MIT — see [`LICENSE`](./LICENSE).
