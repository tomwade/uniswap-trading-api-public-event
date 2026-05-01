import { motion } from 'framer-motion';
import { Background } from './components/Background';
import { SwapCard } from './components/SwapCard';
import { TxHistory } from './components/TxHistory';

export default function App() {
  return (
    <div className="relative min-h-screen">
      <Background />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-4 pb-16 pt-12">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-border/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live on Unichain Sepolia · chain 1301
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            <span className="gradient-text">Swap</span> with vibes.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Powered by the Uniswap Trading API.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <SwapCard />
        </motion.div>

        <TxHistory />

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <a
            href="https://docs.unichain.org/docs/tools/faucets"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            Need testnet ETH or USDC? Grab some from a faucet ↗
          </a>
        </footer>
      </main>
    </div>
  );
}
