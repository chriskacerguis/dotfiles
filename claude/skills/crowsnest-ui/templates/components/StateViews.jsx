import { AlertCircle, Clock, Inbox, Loader2, Lock, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** The three states every data view handles explicitly: loading, error, empty. */

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground', className)} role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={columnIndex} className={cn('h-6', columnIndex === 0 ? 'w-36' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  const isForbidden = error?.status === 403;
  // A 401 means the session ended. The auth provider is already redirecting to
  // sign-in, so this is the frame or two before that lands — it should not
  // accuse the analyst of having broken something, and it must not offer a
  // "Try again" that can only fail the same way.
  const isUnauthenticated = error?.status === 401;
  const Icon = isForbidden ? Lock : isUnauthenticated ? Clock : AlertCircle;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12 text-center', className)} role="alert">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">
          {isForbidden
            ? 'You do not have access to this'
            : isUnauthenticated
              ? 'Your session has ended'
              : 'Something went wrong'}
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {isUnauthenticated
            ? 'Taking you to the sign-in page…'
            : error?.message || 'The request could not be completed.'}
        </p>
      </div>
      {onRetry && !isForbidden && !isUnauthenticated ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12 text-center', className)}>
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function NoResults({ onClear }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results match these filters"
      description="Try widening the filters or clearing them entirely."
      action={
        onClear ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        ) : null
      }
    />
  );
}
