import { useTokenBalance } from '@/hooks/useTokenBalance';
import { formatBalance } from '@/lib/formatters';
import type { Token } from '@/config/tokens';
import { Skeleton } from './ui/skeleton';

export function TokenBalanceLine({ token }: { token: Token }) {
  const { value, isLoading } = useTokenBalance(token);

  if (isLoading) return <Skeleton className="h-4 w-16" />;
  if (value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="font-medium tabular-nums">
      {formatBalance(value, token.decimals)}
    </span>
  );
}
