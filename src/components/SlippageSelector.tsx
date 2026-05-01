import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Slippage } from '@/lib/tradingApi';

interface Props {
  value: Slippage;
  onChange: (s: Slippage) => void;
}

const OPTIONS: Slippage[] = [0.3, 0.5, 1];

export function SlippageSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary/50 px-3 py-2">
      <span className="text-xs font-semibold text-muted-foreground">
        Slippage tolerance
      </span>
      <ToggleGroup
        type="single"
        value={String(value)}
        onValueChange={(v) => {
          if (!v) return;
          const num = Number(v) as Slippage;
          if (OPTIONS.includes(num)) onChange(num);
        }}
      >
        {OPTIONS.map((opt) => (
          <ToggleGroupItem key={opt} value={String(opt)} aria-label={`${opt}%`}>
            {opt}%
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
