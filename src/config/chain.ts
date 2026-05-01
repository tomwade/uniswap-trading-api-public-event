import { defineChain } from 'viem';

export const UNICHAIN_SEPOLIA_ID = 1301 as const;

export const unichainSepolia = defineChain({
  id: UNICHAIN_SEPOLIA_ID,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia.unichain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Uniscan',
      url: 'https://sepolia.uniscan.xyz',
    },
  },
  testnet: true,
});

export const PERMIT2_ADDRESS =
  '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const;

export const UNIVERSAL_ROUTER_ADDRESS =
  '0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d' as const;

export const EXPLORER_URL = 'https://sepolia.uniscan.xyz' as const;

export const UNISWAP_API_BASE = '/api/uniswap' as const;

export const QUOTE_STALE_MS = 25_000 as const;
