import { formatUnits, parseUnits } from 'viem';

export function safeParseUnits(value: string, decimals: number): bigint | null {
  if (!value || !/^\d*\.?\d*$/.test(value)) return null;
  if (value === '' || value === '.') return null;
  try {
    return parseUnits(value, decimals);
  } catch {
    return null;
  }
}

export function formatTokenAmount(
  raw: bigint | string | undefined,
  decimals: number,
  maxFraction = 6,
): string {
  if (raw === undefined || raw === null) return '0';
  const big = typeof raw === 'string' ? BigInt(raw) : raw;
  const formatted = formatUnits(big, decimals);
  const [whole, frac = ''] = formatted.split('.');
  if (!frac) return whole ?? '0';
  const trimmed = frac.replace(/0+$/, '').slice(0, maxFraction);
  return trimmed ? `${whole}.${trimmed}` : (whole ?? '0');
}

export function formatBalance(
  raw: bigint | string | undefined,
  decimals: number,
): string {
  return formatTokenAmount(raw, decimals, 4);
}
