import { ChevronDown, ChevronUp, ChevronsUp, CircleCheck, CircleX, Clock, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { badge, health, priority, requestStatus } from '@/lib/variants';

/**
 * Badges: a word with the colour its meaning carries (lib/variants.js). Each one
 * here is a thin wrapper so a page names what it is showing — <PriorityBadge
 * priority={…} /> — and never decides a colour itself.
 *
 * An absent value is an em dash, not an empty badge: "no value" and a neutral
 * value look different and should.
 */

function Missing() {
  return <span className="text-muted-foreground">—</span>;
}

/**
 * The shared shape: a value of a concept, optionally with an icon before it.
 * `label` overrides the concept's words — for a value whose name is data, or one
 * that says more in context ("Awaiting Dana Reyes" rather than "Awaiting
 * approval"). It may be a node, so a screen reader can be given the words a
 * sighted reader gets from the colour.
 */
export function ConceptBadge({ concept, value, label, icon: Icon, className }) {
  if (value === null || value === undefined || value === '') return <Missing />;
  return (
    <span className={cn(badge({ tone: concept.tone(value) }), className)}>
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {label ?? concept.label(value)}
    </span>
  );
}

// ── Examples: replace these with wrappers for the app's own concepts ─────────

const PRIORITY_ICONS = { urgent: ChevronsUp, high: ChevronUp, normal: Equal, low: ChevronDown };

export function PriorityBadge({ priority: value, className }) {
  return <ConceptBadge concept={priority} value={value} icon={PRIORITY_ICONS[value]} className={className} />;
}

const REQUEST_ICONS = { pending: Clock, approved: CircleCheck, rejected: CircleX };

/**
 * A request's status. While it is pending, `approver` names whose decision it
 * waits on instead of the generic label.
 */
export function RequestStatusBadge({ status, approver, className }) {
  const who = status === 'pending' ? approver?.name || approver?.email : null;
  const label = who ? (
    <>
      Awaiting<span className="sr-only"> approval from</span> {who}
    </>
  ) : undefined;
  return <ConceptBadge concept={requestStatus} value={status} label={label} icon={REQUEST_ICONS[status]} className={className} />;
}

export function HealthBadge({ status, className }) {
  return <ConceptBadge concept={health} value={status} className={className} />;
}
