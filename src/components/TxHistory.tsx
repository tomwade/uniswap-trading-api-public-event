import { motion, AnimatePresence } from 'framer-motion';
import { Check, ExternalLink, Loader2, X, History as HistoryIcon } from 'lucide-react';
import { useTxHistory } from '@/hooks/useTxHistory';
import { Button } from './ui/button';
import { EXPLORER_URL } from '@/config/chain';
import { timeAgo, cn } from '@/lib/utils';

export function TxHistory() {
  const { items, clear } = useTxHistory();

  if (items.length === 0) return null;

  return (
    <div className="mt-6 w-full max-w-md">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold tracking-wide text-muted-foreground">
            Recent swaps
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={clear}
        >
          Clear
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.hash}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
            >
              <a
                href={`${EXPLORER_URL}/tx/${item.hash}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 transition-all hover:bg-card hover:shadow-md',
                )}
              >
                <StatusBadge status={item.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 text-sm font-semibold">
                    <span className="tabular-nums">{item.amountIn}</span>
                    <span>{item.tokenInSymbol}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="tabular-nums">{item.amountOut}</span>
                    <span>{item.tokenOutSymbol}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {labelFor(item.status)} · {timeAgo(item.createdAt)}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function labelFor(status: 'pending' | 'success' | 'failed') {
  if (status === 'pending') return 'Pending';
  if (status === 'success') return 'Complete';
  return 'Failed';
}

function StatusBadge({ status }: { status: 'pending' | 'success' | 'failed' }) {
  if (status === 'pending') {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500 text-white shadow">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow">
        <Check className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow">
      <X className="h-4 w-4" />
    </div>
  );
}
