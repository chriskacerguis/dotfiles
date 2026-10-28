import { cn } from '@/lib/utils';

/**
 * Metadata as a definition list — the detail-page recipe's alternative to a
 * table, since label/value pairs are not tabular data.
 */
export function DetailList({ children, className }) {
  return <dl className={cn('divide-y', className)}>{children}</dl>;
}

export function DetailRow({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
      <dt className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground sm:w-40">
        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        {label}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}
