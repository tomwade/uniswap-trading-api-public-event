import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import type { Token } from '@/config/tokens';
import { UNICHAIN_SEPOLIA_ID } from '@/config/chain';

export function useTokenBalance(token: Token | null) {
  const { address } = useAccount();

  const native = useBalance({
    address,
    chainId: UNICHAIN_SEPOLIA_ID,
    query: {
      enabled: Boolean(address && token?.isNative),
      refetchInterval: 15_000,
    },
  });

  const erc20 = useReadContract({
    address: token && !token.isNative ? token.address : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: UNICHAIN_SEPOLIA_ID,
    query: {
      enabled: Boolean(address && token && !token.isNative),
      refetchInterval: 15_000,
    },
  });

  if (!token || !address) {
    return { value: undefined, isLoading: false, refetch: () => {} };
  }

  if (token.isNative) {
    return {
      value: native.data?.value,
      isLoading: native.isLoading,
      refetch: native.refetch,
    };
  }

  return {
    value: erc20.data as bigint | undefined,
    isLoading: erc20.isLoading,
    refetch: erc20.refetch,
  };
}
