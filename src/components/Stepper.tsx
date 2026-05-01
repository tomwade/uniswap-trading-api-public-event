import { motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import type { FlowStep } from '@/hooks/useSwapFlow';
import { cn } from '@/lib/utils';

interface Props {
  steps: FlowStep[];
}

export function Stepper({ steps }: Props) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <motion.li
          key={step.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-3 transition-colors',
            step.state === 'pending' && 'border-unichain-pink/40 bg-unichain-pink/5',
            step.state === 'success' && 'border-emerald-300 bg-emerald-50',
            step.state === 'error' && 'border-rose-300 bg-rose-50',
            step.state === 'idle' && 'border-border bg-secondary/40',
          )}
        >
          <StepIcon state={step.state} index={i + 1} />
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'font-semibold',
                step.state === 'success' && 'text-emerald-700',
                step.state === 'error' && 'text-rose-700',
              )}
            >
              {step.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {step.errorMessage ?? step.description}
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function StepIcon({
  state,
  index,
}: {
  state: FlowStep['state'];
  index: number;
}) {
  if (state === 'pending') {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-unichain-pink text-white shadow">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (state === 'success') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow"
      >
        <Check className="h-4 w-4" />
      </motion.div>
    );
  }
  if (state === 'error') {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white">
        <X className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold text-muted-foreground ring-1 ring-border">
      {index}
    </div>
  );
}
