import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TOKENS, type Token } from '@/config/tokens';
import { TokenLogo } from './TokenLogo';
import { TokenBalanceLine } from './TokenBalanceLine';
import { cn } from '@/lib/utils';

interface Props {
  selected: Token;
  disabledAddress?: string;
  onChange: (t: Token) => void;
}

export function TokenSelect({ selected, disabledAddress, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-2xl bg-card px-3 py-2 ring-1 ring-border/70 transition-all hover:ring-unichain-pink/50 hover:shadow-md"
        >
          <TokenLogo token={selected} size={28} />
          <span className="font-bold">{selected.symbol}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {TOKENS.map((token, i) => {
            const isDisabled =
              disabledAddress &&
              token.address.toLowerCase() === disabledAddress.toLowerCase();
            const isSelected =
              token.address.toLowerCase() === selected.address.toLowerCase();
            return (
              <motion.button
                key={token.address}
                type="button"
                disabled={Boolean(isDisabled)}
                onClick={() => {
                  onChange(token);
                  setOpen(false);
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-secondary',
                  isDisabled && 'opacity-40 pointer-events-none',
                  isSelected && 'bg-secondary',
                )}
              >
                <TokenLogo token={token} size={40} />
                <div className="flex-1">
                  <div className="font-bold">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.name}</div>
                </div>
                <div className="text-right text-sm">
                  <TokenBalanceLine token={token} />
                </div>
                {isSelected && <Check className="h-4 w-4 text-unichain-pink" />}
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
