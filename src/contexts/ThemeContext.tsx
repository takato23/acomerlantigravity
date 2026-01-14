'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: EffectiveTheme;
  toggleTheme: () => void;
  isHydrated: boolean;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Get system preference
  const getSystemTheme = useCallback((): EffectiveTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Calculate effective theme based on current theme setting
  const calculateEffectiveTheme = useCallback((currentTheme: Theme): EffectiveTheme => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  }, [getSystemTheme]);

  // Apply theme to DOM
  const applyTheme = useCallback((effective: EffectiveTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effective);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effective === 'dark' ? '#020617' : '#ffffff');
    }
  }, []);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored);
      }
    } catch (e) {
      // localStorage might not be available
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Update effective theme and apply to DOM when theme changes
  useEffect(() => {
    if (!isHydrated) return;

    const effective = calculateEffectiveTheme(theme);
    setEffectiveTheme(effective);
    applyTheme(effective);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      // localStorage might not be available
    }
  }, [theme, isHydrated, calculateEffectiveTheme, applyTheme, storageKey]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const effective = getSystemTheme();
      setEffectiveTheme(effective);
      applyTheme(effective);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, applyTheme]);

  // Set theme handler
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Toggle between light and dark (or system preference opposite)
  const toggleTheme = useCallback(() => {
    setThemeState(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'light';
      // If system, toggle to opposite of current system preference
      return getSystemTheme() === 'dark' ? 'light' : 'dark';
    });
  }, [getSystemTheme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    effectiveTheme,
    toggleTheme,
    isHydrated,
  }), [theme, setTheme, effectiveTheme, toggleTheme, isHydrated]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
