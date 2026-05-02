import { differenceInCalendarDays, addDays, parseISO, isValid } from 'date-fns';

export const PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'];

export const toDate = (d) => (d instanceof Date ? d : parseISO(d));

// Parse a stored ISO string into a clean Date (midnight local).
export function dayKey(date) {
  const d = toDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Sort period start-dates ascending, dedup, drop invalids.
export function sortStarts(starts = []) {
  return [...new Set(starts)]
    .map(toDate)
    .filter(isValid)
    .sort((a, b) => a - b)
    .map(dayKey);
}

// Compute average cycle length (days between consecutive period starts).
export function computeAverageCycleLength(starts, fallback = 28) {
  const sorted = sortStarts(starts).map(toDate);
  if (sorted.length < 2) return fallback;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(differenceInCalendarDays(sorted[i], sorted[i - 1]));
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.round(avg);
}

// Standard deviation of cycle gaps — used for regularity score.
export function computeCycleStdDev(starts) {
  const sorted = sortStarts(starts).map(toDate);
  if (sorted.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(differenceInCalendarDays(sorted[i], sorted[i - 1]));
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
  return Math.sqrt(variance);
}

// Regularity bucket from std-dev: <2 days = very regular, <4 = regular, else irregular.
export function regularityLabel(stdDev) {
  if (stdDev == null) return 'Not enough data';
  if (stdDev < 2) return 'Very regular ✨';
  if (stdDev < 4) return 'Regular 🌷';
  return 'Irregular 🌀';
}

// Find the most recent period start on or before `date`.
export function lastStartOnOrBefore(starts, date) {
  const target = toDate(date);
  const sorted = sortStarts(starts).map(toDate);
  let last = null;
  for (const s of sorted) {
    if (s <= target) last = s;
    else break;
  }
  return last;
}

/**
 * Determine the cycle phase for a given date.
 * - Menstruation: day 1..bleedingDuration
 * - Ovulation: cycleLength - 14, ±1 day window
 * - Follicular: between menstruation end and ovulation start
 * - Luteal: after ovulation end through the rest of the cycle
 */
export function getPhaseForDate({
  date,
  starts = [],
  cycleLength = 28,
  bleedingDuration = 5,
}) {
  const d = toDate(date);
  const lastStart = lastStartOnOrBefore(starts, d);
  if (!lastStart) {
    // No history — predict using forward projection from earliest known start, else default to follicular.
    const sorted = sortStarts(starts).map(toDate);
    if (sorted.length === 0) return { phase: 'follicular', dayInCycle: null, lastStart: null };
    // date is before all known starts: count backward
    return { phase: 'follicular', dayInCycle: null, lastStart: null };
  }
  const dayInCycle = differenceInCalendarDays(d, lastStart) + 1; // day 1-indexed
  const ovulationDay = Math.max(10, cycleLength - 14);
  const ovStart = ovulationDay - 1;
  const ovEnd = ovulationDay + 1;

  let phase;
  if (dayInCycle <= bleedingDuration) phase = 'menstruation';
  else if (dayInCycle < ovStart) phase = 'follicular';
  else if (dayInCycle <= ovEnd) phase = 'ovulation';
  else phase = 'luteal';

  return { phase, dayInCycle, lastStart, ovulationDay, cycleLength, bleedingDuration };
}

// Project N future period start dates from the latest known start.
export function predictFutureStarts(starts, cycleLength = 28, count = 6) {
  const sorted = sortStarts(starts).map(toDate);
  if (sorted.length === 0) return [];
  const latest = sorted[sorted.length - 1];
  const out = [];
  for (let i = 1; i <= count; i++) out.push(addDays(latest, cycleLength * i));
  return out;
}

// Average bleeding duration from logged period day-sets, falling back to provided default.
export function computeAverageBleedingDuration(periodDays = [], fallback = 5) {
  // periodDays: array of ISO day strings the user marked as "bleeding"
  if (periodDays.length === 0) return fallback;
  // Group consecutive days into runs
  const sorted = [...new Set(periodDays)].sort();
  const runs = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = toDate(sorted[i - 1]);
    const cur = toDate(sorted[i]);
    if (differenceInCalendarDays(cur, prev) === 1) run.push(sorted[i]);
    else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);
  const avg = runs.reduce((s, r) => s + r.length, 0) / runs.length;
  return Math.max(1, Math.round(avg));
}
