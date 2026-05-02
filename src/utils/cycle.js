import { differenceInCalendarDays, addDays, parseISO, isValid } from 'date-fns';

export const toDate = (d) => (d instanceof Date ? d : parseISO(d));

export function dayKey(date) {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// All bleeding day-keys for one cycle object { start, length }.
export function getCycleBleedingDays(cycle) {
  const start = toDate(cycle.start);
  const days = [];
  for (let i = 0; i < cycle.length; i++) days.push(dayKey(addDays(start, i)));
  return days;
}

// Cycles sorted oldest → newest.
export function sortCycles(cycles = []) {
  return [...cycles]
    .filter((c) => c?.start && isValid(toDate(c.start)))
    .sort((a, b) => a.start.localeCompare(b.start));
}

// Average gap between consecutive period start dates.
export function computeAverageCycleLength(cycles, fallback = 28) {
  const sorted = sortCycles(cycles);
  if (sorted.length < 2) return fallback;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(differenceInCalendarDays(toDate(sorted[i].start), toDate(sorted[i - 1].start)));
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

// Average bleeding length across all logged cycles.
export function computeAverageBleedingDuration(cycles, fallback = 5) {
  const valid = sortCycles(cycles).filter((c) => c.length > 0);
  if (!valid.length) return fallback;
  return Math.round(valid.reduce((s, c) => s + c.length, 0) / valid.length);
}

// Std-dev of cycle gaps — drives regularity label.
export function computeCycleStdDev(cycles) {
  const sorted = sortCycles(cycles);
  if (sorted.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(differenceInCalendarDays(toDate(sorted[i].start), toDate(sorted[i - 1].start)));
  }
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
  return Math.sqrt(variance);
}

export function regularityLabel(stdDev) {
  if (stdDev == null) return 'Not enough data';
  if (stdDev < 2) return 'Very regular ✨';
  if (stdDev < 4) return 'Regular 🌷';
  return 'Irregular 🌀';
}

/**
 * Phase for a given date relative to the most recent cycle that started on or before it.
 * Returns: { phase, dayInCycle, lastCycle }
 */
export function getPhaseForDate({ date, cycles = [], cycleLength = 28 }) {
  const d = toDate(date);
  const sorted = sortCycles(cycles);

  // Most recent cycle that started on or before this date.
  let lastCycle = null;
  for (const c of sorted) {
    if (toDate(c.start) <= d) lastCycle = c;
    else break;
  }

  if (!lastCycle) return { phase: 'follicular', dayInCycle: null, lastCycle: null };

  const dayInCycle = differenceInCalendarDays(d, toDate(lastCycle.start)) + 1;
  const ovulationDay = Math.max(10, cycleLength - 14);

  let phase;
  if (dayInCycle <= lastCycle.length) phase = 'menstruation';
  else if (dayInCycle < ovulationDay - 1) phase = 'follicular';
  else if (dayInCycle <= ovulationDay + 1) phase = 'ovulation';
  else phase = 'luteal';

  return { phase, dayInCycle, lastCycle, ovulationDay };
}

// Project `count` future period start Dates from the most recent cycle start.
export function predictFutureStarts(cycles, cycleLength = 28, count = 6) {
  const sorted = sortCycles(cycles);
  if (!sorted.length) return [];
  const latest = toDate(sorted[sorted.length - 1].start);
  return Array.from({ length: count }, (_, i) => addDays(latest, cycleLength * (i + 1)));
}
