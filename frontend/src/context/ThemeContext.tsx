import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'splitapp_theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => Theme;
  set: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const set = useCallback((next: Theme) => setTheme(next), []);
  const toggle = useCallback((): Theme => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle, set }), [theme, toggle, set]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
