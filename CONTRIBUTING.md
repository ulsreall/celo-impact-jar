# Contributing

Thanks for checking out KindJar.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Before opening a PR

```bash
npm run build
```

## Guidelines

- Keep the frontend lightweight and mobile-first.
- Do not commit `.env`, private keys, `node_modules`, or build output.
- Prefer small, reviewable changes.
- Keep user-facing copy clear for non-technical MiniPay users.
- If adding wallet/contract features, include safety copy and transaction confirmation states.

## Good first issues

- Add campaign history from `Donated` events.
- Add campaign creation form for owner wallet.
- Add shareable campaign cards.
- Improve AI Agent prompts and scoring rules.
