import type { Address } from 'viem';

export type Token = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  logoUrl: string;
  color: string;
};

export const NATIVE_TOKEN_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

export const TOKENS: readonly Token[] = [
  {
    address: NATIVE_TOKEN_ADDRESS,
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    isNative: true,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/info/logo.png',
    color: '#627EEA',
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    color: '#F6F7F9',
  },
  {
    address: '0x31d0220469e10c4e71834a79b1f276d740d3768f',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    color: '#2775CA',
  },
] as const;

export function getTokenByAddress(addr: string): Token | undefined {
  const lower = addr.toLowerCase();
  return TOKENS.find((t) => t.address.toLowerCase() === lower);
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS.find((t) => t.symbol === symbol);
}
