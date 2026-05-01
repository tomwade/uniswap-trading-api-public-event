import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-secondary via-muted to-secondary bg-[length:1000px_100%]',
        className,
      )}
      {...props}
    />
  );
}
