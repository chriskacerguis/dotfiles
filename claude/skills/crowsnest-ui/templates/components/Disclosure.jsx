import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A form or detail most visits do not need, folded behind one line — "Request
 * approval", "Add a note". Open, the line stays as the way to fold it
 * back. Collapsed rather than always open because an always-open form reads as
 * a step that was skipped — unless `defaultOpen`, for a form the person has just
 * asked for (a section added from a menu).
 */
export function Disclosure({ label, icon: Icon, children, className, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline"
      >
        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open ? (
        <div id={panelId} className="mt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
