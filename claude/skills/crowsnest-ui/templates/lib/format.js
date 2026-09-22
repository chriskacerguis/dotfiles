/** Presentation helpers. Formatting lives here, never inline in a page. */

const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME.format(date);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_ONLY.format(date);
}

/** "3 days ago" / "in 5 days", for recency at a glance. */
export function formatRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(Math.round(seconds), 'second');
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : '—';
}

export function formatCvss(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : '—';
}

/** EPSS is a probability; showing it as a percentage is what analysts read. */
export function formatEpss(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  if (number === 0) return '0%';
  if (number < 0.001) return '<0.1%';
  return `${(number * 100).toFixed(1)}%`;
}

export function formatPercentile(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(1)}th` : '—';
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const total = Number(seconds);
  if (!Number.isFinite(total)) return '—';
  if (total < 60) return `${Math.round(total)}s`;
  if (total < 3600) return `${Math.round(total / 60)}m`;
  if (total < 86_400) return `${Math.round(total / 3600)}h`;
  return `${Math.round(total / 86_400)}d`;
}

export function truncate(text, length = 160) {
  if (!text) return '';
  return text.length <= length ? text : `${text.slice(0, length - 1).trimEnd()}…`;
}

/** Age of a finding in whole days, used by the age filters and columns. */
export function ageInDays(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}
