import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ClassicQuoteResponse, RoutePoolHop } from '@/lib/tradingApi';
import { getTokenByAddress } from '@/config/tokens';
import { TokenLogo } from './TokenLogo';
import { shortAddress } from '@/lib/utils';
import { EXPLORER_URL } from '@/config/chain';

interface Props {
  quote: ClassicQuoteResponse | undefined;
}

export function RouteVisualizer({ quote }: Props) {
  if (!quote) return null;
  const routes = quote.quote.route ?? [];

  if (routes.length === 0) {
    return (
      <div className="rounded-2xl bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
        Direct pool route
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Route
        </span>
        <span className="text-xs text-muted-foreground">
          {routes.length === 1 ? '1 path' : `${routes.length} paths`} ·{' '}
          {quote.routing}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {routes.map((path, idx) => (
          <RoutePath key={idx} hops={path} index={idx} />
        ))}
      </div>
    </div>
  );
}

function RoutePath({ hops, index }: { hops: RoutePoolHop[]; index: number }) {
  if (!hops || hops.length === 0) return null;

  const startSymbol =
    getTokenByAddress(hops[0]!.tokenIn.address)?.symbol ??
    hops[0]!.tokenIn.symbol ??
    '???';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-border/60 bg-gradient-to-br from-white to-secondary/30 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TokenChip symbol={startSymbol} address={hops[0]!.tokenIn.address} />
        {hops.map((hop, i) => {
          const outSymbol =
            getTokenByAddress(hop.tokenOut.address)?.symbol ??
            hop.tokenOut.symbol ??
            '???';
          const protocol = hop.type.replace('-pool', '').toUpperCase();
          const fee = hop.fee ? `${(Number(hop.fee) / 10_000).toFixed(2)}%` : null;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 + 0.08 + i * 0.06 }}
              className="flex items-center gap-2"
            >
              <div className="flex flex-col items-center">
                <ArrowRight className="h-4 w-4 text-unichain-pink" />
                <a
                  href={
                    hop.address
                      ? `${EXPLORER_URL}/address/${hop.address}`
                      : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 rounded-lg bg-unichain-pink/10 px-2 py-0.5 text-[10px] font-bold text-unichain-pink hover:bg-unichain-pink/20"
                >
                  {protocol}
                  {fee ? ` · ${fee}` : ''}
                </a>
                {hop.address && (
                  <span className="mt-0.5 text-[9px] text-muted-foreground">
                    {shortAddress(hop.address, 3)}
                  </span>
                )}
              </div>
              <TokenChip symbol={outSymbol} address={hop.tokenOut.address} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TokenChip({ symbol, address }: { symbol: string; address: string }) {
  const known = getTokenByAddress(address);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-1 ring-1 ring-border">
      {known ? (
        <TokenLogo token={known} size={20} />
      ) : (
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-unichain-pink to-unichain-purple" />
      )}
      <span className="text-xs font-bold">{symbol}</span>
    </div>
  );
}
