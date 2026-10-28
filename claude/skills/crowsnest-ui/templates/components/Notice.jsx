import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { TONES } from '@/lib/variants';
import { cn } from '@/lib/utils';

/**
 * A sentence the page needs to say about what just happened or why nothing can
 * be done — "You approved request #12", "This request has been closed". Coloured
 * by meaning through the house tones; the icon follows the tone, so a warning
 * looks like every other warning.
 *
 * `role="status"` so a screen reader announces it when it appears after an
 * action, without interrupting.
 */
const ICONS = { good: CircleCheck, critical: CircleAlert, medium: TriangleAlert };

export function Notice({ tone = 'low', children, className }) {
  const Icon = ICONS[tone] ?? Info;
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', TONES[tone], className)} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
