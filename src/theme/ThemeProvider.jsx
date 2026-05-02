import { createContext, useContext, useEffect, useMemo } from 'react';
import { PHASE_PALETTES, DEFAULT_PHASE } from './palettes';

const ThemeContext = createContext({ phase: DEFAULT_PHASE, palette: PHASE_PALETTES[DEFAULT_PHASE] });

export function ThemeProvider({ phase = DEFAULT_PHASE, children }) {
  const palette = PHASE_PALETTES[phase] ?? PHASE_PALETTES[DEFAULT_PHASE];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(palette.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', palette.vars['--phase-primary']);
  }, [palette]);

  const value = useMemo(() => ({ phase, palette }), [phase, palette]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
