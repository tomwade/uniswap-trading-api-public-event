import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { getQuote, type ClassicQuoteResponse, type Slippage } from '@/lib/tradingApi';
import { UNICHAIN_SEPOLIA_ID } from '@/config/chain';
import type { Token } from '@/config/tokens';
import { useDebounced } from './useDebounced';
import { safeParseUnits } from '@/lib/formatters';

interface Params {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  slippage: Slippage;
}

export function useQuote({ tokenIn, tokenOut, amountIn, slippage }: Params) {
  const { address } = useAccount();
  const debouncedAmount = useDebounced(amountIn, 400);

  const rawAmount = safeParseUnits(debouncedAmount, tokenIn.decimals);
  const enabled =
    Boolean(address) &&
    Boolean(rawAmount) &&
    rawAmount! > 0n &&
    tokenIn.address.toLowerCase() !== tokenOut.address.toLowerCase();

  const queryKey = [
    'quote',
    address ?? null,
    tokenIn.address,
    tokenOut.address,
    debouncedAmount,
    slippage,
  ];

  return useQuery<ClassicQuoteResponse>({
    queryKey,
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 20_000 : false,
    queryFn: () =>
      getQuote({
        swapper: address!,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        chainId: UNICHAIN_SEPOLIA_ID,
        amount: rawAmount!.toString(),
        slippageTolerance: slippage,
      }),
    retry: (failureCount, error: unknown) => {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
      if (status === 400 || status === 404) return false;
      return failureCount < 2;
    },
  });
}
