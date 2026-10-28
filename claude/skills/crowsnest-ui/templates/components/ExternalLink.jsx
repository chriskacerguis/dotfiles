import { ExternalLink as ExternalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A link off the site: a new tab, no opener, and saying so to a screen reader. */
export function ExternalLink({ href, children, className, showIcon = true }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 font-medium text-primary hover:underline', className)}
    >
      {children}
      {showIcon ? <ExternalIcon className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
