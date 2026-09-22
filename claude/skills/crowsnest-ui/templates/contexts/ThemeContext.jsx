import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
// Must match the key in public/theme.js, which applies the theme before the
// app mounts. If they diverge, every load flashes the wrong theme.
const STORAGE_KEY = 'app-theme';

function initialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); fall through.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // A remembered theme is a convenience, not a requirement.
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ theme, setTheme, toggle, isDark: theme === 'dark' }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}
