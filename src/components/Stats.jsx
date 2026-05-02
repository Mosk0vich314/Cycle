import { format } from 'date-fns';
import { differenceInCalendarDays } from 'date-fns';
import { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import { regularityLabel, toDate } from '../utils/cycle';

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
  const { cycles, cycleLength, bleedingDuration, stdDev, todayPhaseInfo, reset } = useCycle();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg cycle"
          value={`${cycleLength}d`}
          hint={cycles.length < 2 ? 'Default — log 2+ periods' : `from ${cycles.length} cycles`}
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

      <div className="bg-phase-surface/70 rounded-squish p-5">
        <h3 className="font-semibold mb-3">Recent periods</h3>
        {cycles.length === 0 ? (
          <p className="text-sm text-phase-muted">Nothing logged yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {[...cycles].reverse().slice(0, 6).map((c, i, arr) => {
              const d = toDate(c.start);
              const prev = arr[i + 1] ? toDate(arr[i + 1].start) : null;
              const gap = prev ? differenceInCalendarDays(d, prev) : null;
              return (
                <li key={c.start} className="flex items-center justify-between">
                  <span className="font-medium">{format(d, 'EEE, MMM d yyyy')}</span>
                  <span className="text-phase-muted text-xs">
                    {c.length}d bleed
                    {gap != null && <> · {gap}d cycle</>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-phase-muted/50">
        v{new Date(__BUILD_TIME__).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </p>

      <div className="text-center pt-1">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs text-phase-muted/40 hover:text-phase-muted/70 transition-colors"
          >
            Reset all data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-phase-muted">This will delete all logged periods.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { reset(); setConfirmReset(false); }}
                className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-xs text-phase-muted hover:text-phase-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
