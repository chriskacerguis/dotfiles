import { useId } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * One card of a detail page: a small heading, an optional icon and
 * something beside it (a count, a progress pill, an Edit link), then the body.
 * A named region, so a screen reader can jump between the cards by title.
 * Anything else (an `id` to scroll to, `tabIndex` to take focus) goes on the card.
 */
export function SectionCard({ title, icon: Icon, aside, children, className, ...props }) {
  const headingId = useId();
  return (
    <Card role="region" aria-labelledby={headingId} className={cn('p-5', className)} {...props}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : null}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}
