import { useEffect, useState } from 'react';
import { SearchInput } from '@/components/FilterBar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

/**
 * A search box bound to a URL filter, which it updates once the person pauses
 * typing rather than on every keystroke. It follows the URL too, so "Clear
 * search" elsewhere on the page empties it.
 */
export function SearchField({ value, onSearch, placeholder, className }) {
  const [text, setText] = useState(value ?? '');
  const settled = useDebouncedValue(text);

  useEffect(() => {
    setText(value ?? '');
  }, [value]);

  useEffect(() => {
    if (settled.trim() !== (value ?? '').trim()) onSearch(settled.trim());
    // onSearch is a new function on every render of the page; the value is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  return <SearchInput value={text} onChange={setText} placeholder={placeholder} className={className} />;
}
