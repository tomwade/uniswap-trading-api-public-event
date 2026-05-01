import { isAddress, isHex, type Address, type Hex } from 'viem';
import { UNISWAP_API_BASE } from '@/config/chain';

const API_KEY = import.meta.env.VITE_UNISWAP_API_KEY ?? '';

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'x-universal-router-version': '2.0',
} as const;

export type Slippage = 0.3 | 0.5 | 1;

export type ApprovalTx = {
  to: Address;
  from: Address;
  data: Hex;
  value: string;
  chainId: number;
  gasLimit?: string;
};

export type CheckApprovalResponse = {
  approval: ApprovalTx | null;
  cancel?: ApprovalTx | null;
};

export type RoutePoolHop = {
  type: 'v2-pool' | 'v3-pool' | 'v4-pool';
  address?: string;
  fee?: string;
  tokenIn: { address: string; chainId: number; symbol?: string; decimals?: number };
  tokenOut: { address: string; chainId: number; symbol?: string; decimals?: number };
  amountIn?: string;
  amountOut?: string;
};

export type ClassicQuote = {
  input: { token: string; amount: string };
  output: { token: string; amount: string };
  slippage: number;
  route: RoutePoolHop[][];
  gasFee: string;
  gasFeeUSD?: string;
  gasUseEstimate?: string;
};

export type ClassicQuoteResponse = {
  routing: 'CLASSIC' | 'WRAP' | 'UNWRAP';
  quote: ClassicQuote;
  permitData: Record<string, unknown> | null;
  requestId?: string;
};

export type SwapTx = {
  to: Address;
  from: Address;
  data: Hex;
  value: string;
  chainId: number;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export type SwapResponse = {
  swap: SwapTx;
  requestId?: string;
};

class TradingApiError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'TradingApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${UNISWAP_API_BASE}${path}`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? (data as { detail?: string }).detail
        : undefined;
    throw new TradingApiError(
      detail ?? `Trading API ${path} failed (${res.status})`,
      res.status,
      data,
    );
  }
  return data as T;
}

export async function checkApproval(params: {
  walletAddress: Address;
  token: Address;
  amount: string;
  chainId: number;
}): Promise<CheckApprovalResponse> {
  return postJson<CheckApprovalResponse>('/check_approval', params);
}

export async function getQuote(params: {
  swapper: Address;
  tokenIn: Address;
  tokenOut: Address;
  chainId: number;
  amount: string;
  slippageTolerance: Slippage;
}): Promise<ClassicQuoteResponse> {
  const body = {
    swapper: params.swapper,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    tokenInChainId: String(params.chainId),
    tokenOutChainId: String(params.chainId),
    amount: params.amount,
    type: 'EXACT_INPUT',
    slippageTolerance: params.slippageTolerance,
    // BEST_PRICE on Unichain Sepolia returns CLASSIC routes (UniswapX is mainnet-only).
    routingPreference: 'BEST_PRICE',
    protocols: ['V2', 'V3', 'V4'],
  };
  return postJson<ClassicQuoteResponse>('/quote', body);
}

export async function getSwap(
  quoteResponse: ClassicQuoteResponse,
  permit2Signature?: Hex,
): Promise<SwapResponse> {
  // Strip permitData/permitTransaction; handle permit fields explicitly.
  // (Skill rule: spread the quote into the body, never wrap in {quote: ...}.)
  const {
    permitData,
    // permitTransaction may exist on some responses
    ...cleanQuote
  } = quoteResponse as ClassicQuoteResponse & {
    permitTransaction?: unknown;
  };

  const body: Record<string, unknown> = { ...cleanQuote };

  if (permit2Signature && permitData && typeof permitData === 'object') {
    body.signature = permit2Signature;
    body.permitData = permitData;
  }

  return postJson<SwapResponse>('/swap', body);
}

export function validateSwapTx(tx: SwapTx): void {
  const data = tx?.data as string | undefined;
  if (!data || data === '' || data === '0x') {
    throw new Error('swap.data is empty — quote may have expired. Please refresh.');
  }
  if (!isHex(tx.data)) {
    throw new Error('swap.data is not valid hex');
  }
  if (!isAddress(tx.to)) throw new Error('swap.to is not a valid address');
  if (!isAddress(tx.from)) throw new Error('swap.from is not a valid address');
  if (tx.value === undefined || tx.value === null) {
    throw new Error('swap.value is missing');
  }
}

export { TradingApiError };
