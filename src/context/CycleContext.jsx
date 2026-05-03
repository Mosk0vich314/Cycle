import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  computeAverageCycleLength,
  computeAverageBleedingDuration,
  computeCycleStdDev,
  getPhaseForDate,
  sortCycles,
  dayKey,
  getCycleBleedingDays,
} from '../utils/cycle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { PARTNER_KEY } from '../services/sync';

const CycleContext = createContext(null);

// v2 schema: periods are stored as cycle objects, not flat day arrays.
// Using a new storage key so old data doesn't conflict.
const INITIAL = {
  cycles: [],           // [{ start: 'yyyy-mm-dd', length: number }]
  manualCycleLength: null,
};

const DEFAULT_BLEEDING_DURATION = 5;

export function CycleProvider({ children }) {
  const [data, setData] = useLocalStorage('cute-cycle-data-v2', INITIAL);
  const [isPartnerMode, setPartnerMode] = useLocalStorage(PARTNER_KEY, false);

  // Replace the entire stored payload — used when pulling a remote sync.
  const replaceAll = useCallback((next) => {
    setData(() => ({
      cycles: Array.isArray(next?.cycles) ? next.cycles : [],
      manualCycleLength: next?.manualCycleLength ?? null,
    }));
  }, [setData]);

  // Add a new cycle (or replace one with the same start key).
  const addCycle = useCallback((date, length) => {
    const start = dayKey(date);
    setData((prev) => {
      const bleedLen = length ?? computeAverageBleedingDuration(prev.cycles, DEFAULT_BLEEDING_DURATION);
      // Remove any existing cycle with this exact start (idempotent upsert).
      const rest = prev.cycles.filter((c) => c.start !== start);
      return { ...prev, cycles: [...rest, { start, length: bleedLen }] };
    });
  }, [setData]);

  // Remove a cycle by its start key.
  const removeCycle = useCallback((startKey) => {
    setData((prev) => ({ ...prev, cycles: prev.cycles.filter((c) => c.start !== startKey) }));
  }, [setData]);

  // Grow or shrink the bleeding window of an existing cycle by `delta` days (±1).
  const adjustCycleDuration = useCallback((startKey, delta) => {
    setData((prev) => ({
      ...prev,
      cycles: prev.cycles.map((c) =>
        c.start === startKey ? { ...c, length: Math.max(1, Math.min(14, c.length + delta)) } : c
      ),
    }));
  }, [setData]);

  const reset = useCallback(() => setData(INITIAL), [setData]);

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, [setData]);

  // ----- derived stats -----
  const cycleLength = useMemo(
    () => data.manualCycleLength ?? computeAverageCycleLength(data.cycles, 28),
    [data.manualCycleLength, data.cycles],
  );

  const bleedingDuration = useMemo(
    () => computeAverageBleedingDuration(data.cycles, DEFAULT_BLEEDING_DURATION),
    [data.cycles],
  );

  const stdDev = useMemo(() => computeCycleStdDev(data.cycles), [data.cycles]);

  const today = useMemo(() => new Date(), []);
  const todayPhaseInfo = useMemo(
    () => getPhaseForDate({ date: today, cycles: data.cycles, cycleLength }),
    [today, data.cycles, cycleLength],
  );

  // Pre-built set of all confirmed bleeding day-keys for O(1) calendar lookups.
  const confirmedBleedingSet = useMemo(() => {
    const out = new Set();
    for (const c of data.cycles) getCycleBleedingDays(c).forEach((k) => out.add(k));
    return out;
  }, [data.cycles]);

  const value = useMemo(() => ({
    data,                         // raw payload, used by sync push
    cycles: sortCycles(data.cycles),
    confirmedBleedingSet,
    cycleLength,
    bleedingDuration,
    stdDev,
    todayPhase: todayPhaseInfo.phase,
    todayPhaseInfo,
    isPartnerMode,
    setPartnerMode,
    addCycle,
    removeCycle,
    adjustCycleDuration,
    reset,
    update,
    replaceAll,
    getPhaseForDate: (date) => getPhaseForDate({ date, cycles: data.cycles, cycleLength }),
  }), [data, confirmedBleedingSet, cycleLength, bleedingDuration, stdDev,
      todayPhaseInfo, isPartnerMode, setPartnerMode,
      addCycle, removeCycle, adjustCycleDuration, reset, update, replaceAll]);

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
