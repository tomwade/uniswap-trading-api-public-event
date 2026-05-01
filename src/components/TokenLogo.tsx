import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Token } from '@/config/tokens';

interface Props {
  token: Token;
  size?: number;
  className?: string;
}

export function TokenLogo({ token, size = 32, className }: Props) {
  const [errored, setErrored] = useState(false);

  const dim = { width: size, height: size };

  if (errored) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white',
          className,
        )}
        style={{ ...dim, backgroundColor: token.color }}
      >
        <span style={{ fontSize: size * 0.4 }}>{token.symbol.slice(0, 2)}</span>
      </div>
    );
  }

  return (
    <img
      src={token.logoUrl}
      alt={token.symbol}
      className={cn('rounded-full bg-white object-cover ring-1 ring-border/50', className)}
      style={dim}
      onError={() => setErrored(true)}
    />
  );
}
