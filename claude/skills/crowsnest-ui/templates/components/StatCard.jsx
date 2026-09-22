import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

const TONES = {
  default: 'border-border',
  critical: 'border-red-300 dark:border-red-900/60',
  high: 'border-orange-300 dark:border-orange-900/60',
  medium: 'border-amber-300 dark:border-amber-900/60',
  good: 'border-emerald-300 dark:border-emerald-900/60',
};

const VALUE_TONES = {
  default: 'text-foreground',
  critical: 'text-red-700 dark:text-red-300',
  high: 'text-orange-700 dark:text-orange-300',
  medium: 'text-amber-700 dark:text-amber-300',
  good: 'text-emerald-700 dark:text-emerald-300',
};

/**
 * A single number on the dashboard. Wrapped in a link whenever the number
 * corresponds to a filtered view, so every figure is a way in rather than a
 * dead end.
 */
export function StatCard({ label, value, hint, tone = 'default', to, icon: Icon }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', VALUE_TONES[tone])}>{formatNumber(value)}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  const className = cn(
    'block rounded-lg border bg-card p-4 shadow-sm transition-colors',
    TONES[tone],
    to && 'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
