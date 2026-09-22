import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Compose conditional Tailwind classes without string concatenation. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
