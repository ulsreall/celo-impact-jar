# Security Policy

KindJar is a self-custody donation app. Users should always verify transactions before signing.

## User safety principles

- The app never asks for seed phrases or private keys.
- The app never takes custody of user wallets.
- Users approve token spend and donation transactions manually.
- Donation data is verifiable on Celo mainnet.
- Real private keys must never be committed to GitHub or added to frontend environment variables.

## Environment variables

Safe frontend variables use the `VITE_` prefix and are public by design:

```bash
VITE_IMPACT_JAR_ADDRESS=
VITE_DEFAULT_TOKEN_ADDRESS=
```

Sensitive deployment variables are only for local contract deployment:

```bash
PRIVATE_KEY=
CELOSCAN_API_KEY=
```

Do not expose deployment private keys in Vercel, GitHub, screenshots, Telegram, or public logs.

## Reporting issues

Open a GitHub issue with:

- affected file/feature
- steps to reproduce
- expected vs actual behavior
- wallet/browser environment if relevant

For sensitive contract/security findings, avoid posting exploit details publicly until the maintainer has responded.
