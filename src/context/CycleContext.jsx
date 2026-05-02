import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  computeAverageCycleLength,
  computeAverageBleedingDuration,
  computeCycleStdDev,
  getPhaseForDate,
  sortStarts,
  dayKey,
} from '../utils/cycle';
import { ThemeProvider } from '../theme/ThemeProvider';

const CycleContext = createContext(null);

const INITIAL = {
  periodStarts: [], // ISO yyyy-mm-dd strings — first day of each logged period
  periodDays: [],   // ISO yyyy-mm-dd strings — every individual bleeding day logged
  manualCycleLength: null,
  manualBleedingDuration: null,
};

export function CycleProvider({ children }) {
  const [data, setData] = useLocalStorage('cute-cycle-data-v1', INITIAL);

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, [setData]);

  const togglePeriodDay = useCallback((date) => {
    const k = dayKey(date);
    setData((prev) => {
      const has = prev.periodDays.includes(k);
      const periodDays = has ? prev.periodDays.filter((d) => d !== k) : [...prev.periodDays, k];
      // Recompute periodStarts from periodDays: a "start" is a bleeding day whose previous day is NOT bleeding.
      const sortedDays = [...new Set(periodDays)].sort();
      const set = new Set(sortedDays);
      const periodStarts = sortedDays.filter((d) => {
        const prevDay = new Date(d);
        prevDay.setDate(prevDay.getDate() - 1);
        return !set.has(dayKey(prevDay));
      });
      return { ...prev, periodDays, periodStarts };
    });
  }, [setData]);

  const reset = useCallback(() => setData(INITIAL), [setData]);

  const cycleLength = useMemo(
    () => data.manualCycleLength || computeAverageCycleLength(data.periodStarts, 28),
    [data.manualCycleLength, data.periodStarts],
  );

  const bleedingDuration = useMemo(
    () => data.manualBleedingDuration || computeAverageBleedingDuration(data.periodDays, 5),
    [data.manualBleedingDuration, data.periodDays],
  );

  const stdDev = useMemo(() => computeCycleStdDev(data.periodStarts), [data.periodStarts]);

  const today = useMemo(() => new Date(), []);
  const todayPhaseInfo = useMemo(
    () => getPhaseForDate({
      date: today,
      starts: data.periodStarts,
      cycleLength,
      bleedingDuration,
    }),
    [today, data.periodStarts, cycleLength, bleedingDuration],
  );

  const value = useMemo(() => ({
    ...data,
    sortedStarts: sortStarts(data.periodStarts),
    cycleLength,
    bleedingDuration,
    stdDev,
    todayPhase: todayPhaseInfo.phase,
    todayPhaseInfo,
    update,
    togglePeriodDay,
    reset,
    getPhaseForDate: (date) => getPhaseForDate({
      date,
      starts: data.periodStarts,
      cycleLength,
      bleedingDuration,
    }),
  }), [data, cycleLength, bleedingDuration, stdDev, todayPhaseInfo, update, togglePeriodDay, reset]);

  return (
    <CycleContext.Provider value={value}>
      <ThemeProvider phase={value.todayPhase}>{children}</ThemeProvider>
    </CycleContext.Provider>
  );
}

export function useCycle() {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error('useCycle must be used inside <CycleProvider>');
  return ctx;
}
