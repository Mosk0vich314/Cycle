import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { regularityLabel, predictFutureStarts, toDate } from '../utils/cycle';

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-phase-surface rounded-squish p-4 shadow-squish">
      <p className="text-xs uppercase tracking-wide text-phase-muted">{label}</p>
      <p className="text-2xl font-bold text-phase-text mt-1">{value}</p>
      {hint && <p className="text-xs text-phase-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function Stats() {
  const {
    sortedStarts,
    cycleLength,
    bleedingDuration,
    stdDev,
    todayPhaseInfo,
  } = useCycle();

  const nextStart = useMemo(() => {
    const [next] = predictFutureStarts(sortedStarts, cycleLength, 1);
    return next ?? null;
  }, [sortedStarts, cycleLength]);

  const daysUntilNext = useMemo(() => {
    if (!nextStart) return null;
    return Math.max(0, differenceInCalendarDays(nextStart, new Date()));
  }, [nextStart]);

  const cycleCount = sortedStarts.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg cycle"
          value={`${cycleLength}d`}
          hint={cycleCount < 2 ? 'Default — log 2+ periods' : `from ${cycleCount} cycles`}
        />
        <StatCard
          label="Avg period"
          value={`${bleedingDuration}d`}
          hint="bleeding length"
        />
        <StatCard
          label="Regularity"
          value={regularityLabel(stdDev)}
          hint={stdDev != null ? `σ ≈ ${stdDev.toFixed(1)} days` : 'log 3+ cycles'}
        />
        <StatCard
          label="Cycle day"
          value={todayPhaseInfo.dayInCycle ? `Day ${todayPhaseInfo.dayInCycle}` : '—'}
          hint={`Phase: ${todayPhaseInfo.phase}`}
        />
      </div>

      <div className="bg-phase-surface rounded-squish p-5 shadow-squish">
        <h3 className="font-semibold mb-2">Next period</h3>
        {nextStart ? (
          <p className="text-phase-text">
            <span className="text-2xl font-bold text-phase-accent">{format(nextStart, 'MMM d')}</span>
            <span className="text-phase-muted"> · in {daysUntilNext} day{daysUntilNext === 1 ? '' : 's'}</span>
          </p>
        ) : (
          <p className="text-sm text-phase-muted">Log a period to start predicting 🌷</p>
        )}
      </div>

      <div className="bg-phase-surface/70 rounded-squish p-5">
        <h3 className="font-semibold mb-3">Recent periods</h3>
        {sortedStarts.length === 0 ? (
          <p className="text-sm text-phase-muted">Nothing logged yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {sortedStarts.slice(-6).reverse().map((s, i, arr) => {
              const d = toDate(s);
              const prev = arr[i + 1] ? toDate(arr[i + 1]) : null;
              const gap = prev ? differenceInCalendarDays(d, prev) : null;
              return (
                <li key={s} className="flex items-center justify-between">
                  <span className="font-medium">{format(d, 'EEE, MMM d yyyy')}</span>
                  <span className="text-phase-muted text-xs">
                    {gap != null ? `${gap}d cycle` : 'first logged'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
