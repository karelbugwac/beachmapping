'use client';

import React, { createContext, useContext } from 'react';
import { useWaveThemeToggle, type Theme } from '@/lib/hooks/use-wave-theme';

export type { Theme };

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const waveTheme = useWaveThemeToggle();

  return (
    <ThemeContext.Provider value={waveTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
      isTransitioning: false,
      mounted: false,
    };
  }
  return context;
}
