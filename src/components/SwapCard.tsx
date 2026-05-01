import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { TokenSelect } from './TokenSelect';
import { SlippageSelector } from './SlippageSelector';
import { RouteVisualizer } from './RouteVisualizer';
import { SwapModal } from './SwapModal';
import { TokenLogo } from './TokenLogo';

import { TOKENS, type Token } from '@/config/tokens';
import { UNICHAIN_SEPOLIA_ID } from '@/config/chain';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useQuote } from '@/hooks/useQuote';
import { useSwapFlow } from '@/hooks/useSwapFlow';
import { formatBalance, formatTokenAmount, safeParseUnits } from '@/lib/formatters';
import type { Slippage } from '@/lib/tradingApi';

const SLIPPAGE_KEY = 'swap-slippage-v1';

function readStoredSlippage(): Slippage {
  try {
    const v = window.localStorage.getItem(SLIPPAGE_KEY);
    const num = Number(v);
    if (num === 0.3 || num === 0.5 || num === 1) return num;
  } catch {
    /* ignore */
  }
  return 0.5;
}

export function SwapCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]!);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[2]!);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState<Slippage>(() =>
    typeof window !== 'undefined' ? readStoredSlippage() : 0.5,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(SLIPPAGE_KEY, String(slippage));
    } catch {
      /* ignore */
    }
  }, [slippage]);

  const inBalance = useTokenBalance(tokenIn);
  const outBalance = useTokenBalance(tokenOut);

  const quote = useQuote({ tokenIn, tokenOut, amountIn, slippage });
  const flow = useSwapFlow();

  const amountOutDisplay = useMemo(() => {
    if (!quote.data) return '';
    return formatTokenAmount(
      quote.data.quote.output.amount,
      tokenOut.decimals,
      6,
    );
  }, [quote.data, tokenOut.decimals]);

  const rawAmountIn = safeParseUnits(amountIn, tokenIn.decimals);
  const insufficientBalance =
    Boolean(rawAmountIn) &&
    inBalance.value !== undefined &&
    rawAmountIn! > inBalance.value;

  function flipTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
  }

  function handleMax() {
    if (inBalance.value === undefined) return;
    // Reserve a tiny ETH buffer for gas if native
    const value = tokenIn.isNative
      ? inBalance.value > 5_000_000_000_000_000n
        ? inBalance.value - 5_000_000_000_000_000n
        : 0n
      : inBalance.value;
    setAmountIn(formatTokenAmount(value, tokenIn.decimals, 8));
  }

  async function handleSwap() {
    if (!address || !quote.data) return;
    if (chainId !== UNICHAIN_SEPOLIA_ID) {
      try {
        await switchChain({ chainId: UNICHAIN_SEPOLIA_ID });
      } catch {
        toast.error('Please switch to Unichain Sepolia');
        return;
      }
    }
    await flow.run({
      account: address,
      tokenIn,
      tokenOut,
      amountInDisplay: amountIn,
      slippage,
      quoteResponse: quote.data,
    });
  }

  const wrongChain = isConnected && chainId !== UNICHAIN_SEPOLIA_ID;

  let actionLabel = 'Swap';
  let actionDisabled = false;
  if (!isConnected) {
    actionLabel = 'Connect wallet';
    actionDisabled = true;
  } else if (wrongChain) {
    actionLabel = 'Switch to Unichain Sepolia';
  } else if (!amountIn || !rawAmountIn || rawAmountIn === 0n) {
    actionLabel = 'Enter an amount';
    actionDisabled = true;
  } else if (quote.isLoading) {
    actionLabel = 'Fetching quote…';
    actionDisabled = true;
  } else if (quote.isError) {
    actionLabel = 'No route — try another amount';
    actionDisabled = true;
  } else if (insufficientBalance) {
    actionLabel = `Insufficient ${tokenIn.symbol}`;
    actionDisabled = true;
  }

  return (
    <>
      <Card className="w-full max-w-md overflow-visible">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">Swap</h2>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>

          <SlippageSelector value={slippage} onChange={setSlippage} />

          {/* Token In */}
          <TokenInputRow
            label="You pay"
            token={tokenIn}
            amount={amountIn}
            onAmountChange={setAmountIn}
            balance={inBalance.value}
            balanceLoading={inBalance.isLoading}
            onMax={handleMax}
            otherAddress={tokenOut.address}
            onSelect={setTokenIn}
          />

          {/* Flip button */}
          <div className="-my-1 grid place-items-center">
            <motion.button
              type="button"
              onClick={flipTokens}
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-card bg-secondary shadow-md hover:bg-unichain-pink/10"
              aria-label="Flip tokens"
            >
              <ArrowDown className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Token Out */}
          <TokenInputRow
            label="You receive"
            token={tokenOut}
            amount={amountOutDisplay}
            balance={outBalance.value}
            balanceLoading={outBalance.isLoading}
            otherAddress={tokenIn.address}
            onSelect={setTokenOut}
            readonly
            loading={quote.isFetching && Boolean(amountIn)}
          />

          {/* Quote info row */}
          {quote.data && (
            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                1 {tokenIn.symbol} ≈{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {computeRate(quote.data, tokenIn, tokenOut)}
                </span>{' '}
                {tokenOut.symbol}
              </span>
              {quote.data.quote.gasFeeUSD &&
                Number(quote.data.quote.gasFeeUSD) > 0 && (
                  <span className="text-muted-foreground">
                    ⛽ ${Number(quote.data.quote.gasFeeUSD).toFixed(3)}
                  </span>
                )}
            </div>
          )}

          {/* Route */}
          <RouteVisualizer quote={quote.data} />

          {/* Action button */}
          <Button
            size="xl"
            disabled={actionDisabled}
            onClick={() => {
              if (wrongChain) {
                switchChain({ chainId: UNICHAIN_SEPOLIA_ID });
                return;
              }
              handleSwap();
            }}
          >
            {actionLabel}
          </Button>
        </CardContent>
      </Card>

      <SwapModal
        open={flow.open}
        onOpenChange={flow.setOpen}
        steps={flow.steps}
        error={flow.error}
        done={flow.done}
        submittedHash={flow.submittedHash}
        tokenIn={tokenIn}
        tokenOut={tokenOut}
        amountIn={amountIn}
        amountOut={amountOutDisplay}
        onClose={() => {
          flow.reset();
          if (flow.done) {
            setAmountIn('');
            inBalance.refetch();
            outBalance.refetch();
          }
        }}
      />
    </>
  );
}

function computeRate(
  quote: NonNullable<ReturnType<typeof useQuote>['data']>,
  tIn: Token,
  tOut: Token,
): string {
  try {
    const rawIn = BigInt(quote.quote.input.amount);
    const rawOut = BigInt(quote.quote.output.amount);
    if (rawIn === 0n) return '0';
    // out/in scaled, then format with tOut decimals
    const scaled =
      (rawOut * 10n ** BigInt(tIn.decimals)) /
      (rawIn === 0n ? 1n : rawIn);
    return formatTokenAmount(scaled, tOut.decimals, 6);
  } catch {
    return '—';
  }
}

interface RowProps {
  label: string;
  token: Token;
  amount: string;
  onAmountChange?: (v: string) => void;
  balance: bigint | undefined;
  balanceLoading: boolean;
  otherAddress: string;
  onSelect: (t: Token) => void;
  onMax?: () => void;
  readonly?: boolean;
  loading?: boolean;
}

function TokenInputRow({
  label,
  token,
  amount,
  onAmountChange,
  balance,
  balanceLoading,
  otherAddress,
  onSelect,
  onMax,
  readonly,
  loading,
}: RowProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TokenLogo token={token} size={14} />
          {balanceLoading ? (
            <Skeleton className="h-3 w-12" />
          ) : (
            <span className="tabular-nums">
              {balance !== undefined ? formatBalance(balance, token.decimals) : '—'}
            </span>
          )}
          {!readonly && balance !== undefined && balance > 0n && (
            <button
              type="button"
              onClick={onMax}
              className="ml-1 rounded-md bg-unichain-pink/10 px-1.5 py-0.5 text-[10px] font-bold text-unichain-pink hover:bg-unichain-pink/20"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {loading ? (
          <Skeleton className="h-10 flex-1 rounded-md" />
        ) : (
          <input
            inputMode="decimal"
            placeholder="0"
            readOnly={readonly}
            value={amount}
            onChange={(e) => {
              if (readonly) return;
              const v = e.target.value.replace(/,/g, '.');
              if (v === '' || /^\d*\.?\d*$/.test(v)) {
                onAmountChange?.(v);
              }
            }}
            className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
        )}
        <TokenSelect
          selected={token}
          disabledAddress={otherAddress}
          onChange={onSelect}
        />
      </div>
    </div>
  );
}
