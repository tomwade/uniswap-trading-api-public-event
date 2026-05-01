import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stepper } from './Stepper';
import { ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import type { FlowStep } from '@/hooks/useSwapFlow';
import type { Hex } from 'viem';
import { EXPLORER_URL } from '@/config/chain';
import type { Token } from '@/config/tokens';
import { TokenLogo } from './TokenLogo';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: FlowStep[];
  error: string | null;
  done: boolean;
  submittedHash: Hex | null;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  onClose: () => void;
}

export function SwapModal({
  open,
  onOpenChange,
  steps,
  error,
  done,
  submittedHash,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  onClose,
}: Props) {
  const isPending = steps.some((s) => s.state === 'pending');

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && isPending) return;
        onOpenChange(o);
      }}
    >
      <DialogContent
        hideClose={isPending}
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2">
              {done ? (
                <>
                  <Sparkles className="h-5 w-5 text-unichain-pink" />
                  Swap complete
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  Something went wrong
                </>
              ) : (
                <>Confirm swap</>
              )}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {done
                ? 'Your tokens are on the way.'
                : error
                  ? 'Review the error below and retry.'
                  : 'Approve and sign the steps in your wallet.'}
            </DialogDescription>
          </div>

          {/* Swap summary */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3">
            <div className="flex items-center gap-2">
              <TokenLogo token={tokenIn} size={28} />
              <div>
                <div className="text-xs text-muted-foreground">From</div>
                <div className="font-bold tabular-nums">
                  {amountIn} {tokenIn.symbol}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">To</div>
                <div className="font-bold tabular-nums">
                  {amountOut} {tokenOut.symbol}
                </div>
              </div>
              <TokenLogo token={tokenOut} size={28} />
            </div>
          </div>

          <Stepper steps={steps} />

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {submittedHash && (
              <Button asChild variant="outline" className="flex-1">
                <a
                  href={`${EXPLORER_URL}/tx/${submittedHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Uniscan
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {!isPending && (
              <Button
                onClick={onClose}
                className="flex-1"
                variant={done ? 'default' : 'secondary'}
              >
                {done ? 'Done' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
