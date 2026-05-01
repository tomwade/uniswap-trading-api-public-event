# Unichain Sepolia Swap Widget

A playful one-page swap widget that uses the **Uniswap Trading API** on **Unichain Sepolia** (chain ID `1301`).

Built with Vite + React + TypeScript, wagmi v2 + viem, RainbowKit, Tailwind CSS / shadcn-style primitives, and framer-motion.

## Features

- Connect any wallet via RainbowKit (MetaMask, Rabby, WalletConnect, …)
- Token dropdown for ETH / WETH / USDC with live balances
- Live debounced quote with **0.3 / 0.5 / 1%** slippage tolerance
- Animated **route visualization** (V2 / V3 / V4 hops, fee tiers, pool links)
- Multi-step flow modal: **Approve → Sign permit → Swap** (steps shown only when needed)
- Persistent **transaction history** with pending → complete icons (newest first), links to Uniscan
- Confetti on success because why not

## Quick start

```bash
npm install
cp .env.example .env   # already done — add your keys
npm run dev
```

Open <http://localhost:5173>.

### Environment variables

`.env`:

```
VITE_UNISWAP_API_KEY=your-uniswap-trading-api-key
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

- Uniswap Trading API key: <https://developers.uniswap.org/>
- WalletConnect project ID (for mobile wallets): <https://cloud.walletconnect.com/>
  Optional — RainbowKit will still work with injected wallets if absent, but the WalletConnect button will fail to initialise.

### Get testnet funds

- Unichain Sepolia ETH: <https://docs.unichain.org/docs/tools/faucets>
- Unichain Sepolia USDC (Circle): same page
- Bridge from Ethereum Sepolia: <https://app.optimism.io/bridge>

## Architecture

```
src/
├── config/
│   ├── chain.ts       Unichain Sepolia constants
│   ├── tokens.ts      ETH / WETH / USDC list
│   └── wagmi.ts       wagmi + RainbowKit config
├── lib/
│   ├── tradingApi.ts  /check_approval, /quote, /swap helpers
│   ├── formatters.ts  parseUnits / formatUnits helpers
│   └── utils.ts       cn, shortAddress, timeAgo
├── hooks/
│   ├── useTokenBalance.ts  Native + ERC20
│   ├── useQuote.ts         Debounced react-query
│   ├── useSwapFlow.ts      Approve → Sign → Swap state machine
│   └── useTxHistory.ts     localStorage CRUD + receipt polling
├── components/
│   ├── SwapCard.tsx        Two TokenInputRows, slippage, route, action
│   ├── TokenSelect.tsx     Dialog token picker w/ live balances
│   ├── SlippageSelector.tsx
│   ├── RouteVisualizer.tsx Animated pool-hop graph
│   ├── SwapModal.tsx       Multi-step processing modal
│   ├── Stepper.tsx         Approve / Sign / Swap indicators
│   ├── TxHistory.tsx       Persistent transaction log
│   ├── Background.tsx      Animated gradient blobs
│   └── ui/                 Button, Card, Dialog, ToggleGroup, Skeleton
└── App.tsx
```

## Presentation walkthrough

A presenter-friendly tour of the Trading API integration, with annotated code references and a suggested demo narrative, lives in [`docs/PRESENTATION.md`](docs/PRESENTATION.md).

## How the Trading API integration works

The browser cannot call `https://trade-api.gateway.uniswap.org/v1/*` directly because the API rejects CORS preflight requests with `415 Unsupported Media Type`. We proxy through Vite's dev server (see [`vite.config.ts`](vite.config.ts)):

```ts
server: {
  proxy: {
    '/api/uniswap': {
      target: 'https://trade-api.gateway.uniswap.org/v1',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/uniswap/, ''),
    },
  },
}
```

Then the 3-step flow runs in [`useSwapFlow.ts`](src/hooks/useSwapFlow.ts):

1. **`POST /check_approval`** — if the input token is an ERC20, check whether Permit2 has allowance. Submit an approval tx if needed.
2. **`POST /quote`** — get the executable route + (optionally) `permitData` for Permit2. The full response is preserved and re-used in step 3.
3. **`POST /swap`** — spread the quote response into the body (don't wrap it in `{quote: …}`), strip null `permitData`, attach the user's signature + `permitData` together for CLASSIC routes. Validate `swap.data` is non-empty hex before broadcasting.

All API calls include `x-api-key` and `x-universal-router-version: 2.0` headers.

## Production deployment

The Vite dev proxy only works in development. For production, add a server-side rewrite. Examples:

**Vercel** (`vercel.json`):

```json
{
  "rewrites": [
    {
      "source": "/api/uniswap/:path*",
      "destination": "https://trade-api.gateway.uniswap.org/v1/:path*"
    }
  ]
}
```

**Cloudflare Pages** (`public/_redirects`):

```
/api/uniswap/* https://trade-api.gateway.uniswap.org/v1/:splat 200
```

Note that exposing the API key client-side via the proxy means anyone can use it. Production deployments should add a server route that injects the `x-api-key` header server-side instead of passing it from the browser.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript + Vite build
- `npm run preview` — Preview the production build
- `npm run lint` — ESLint

## License

MIT
