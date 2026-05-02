import Calendar from 'react-calendar';
import { useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { dayKey, predictFutureStarts, toDate } from '../utils/cycle';

export default function CycleCalendar() {
  const {
    periodDays,
    sortedStarts,
    cycleLength,
    bleedingDuration,
    togglePeriodDay,
    getPhaseForDate,
  } = useCycle();
  const [selected, setSelected] = useState(new Date());

  const periodSet = useMemo(() => new Set(periodDays), [periodDays]);

  // Predicted future period day-keys (next 6 cycles, each 'bleedingDuration' days long)
  const predictedPeriodSet = useMemo(() => {
    const out = new Set();
    const futures = predictFutureStarts(sortedStarts, cycleLength, 6);
    for (const start of futures) {
      for (let i = 0; i < bleedingDuration; i++) {
        out.add(dayKey(addDays(start, i)));
      }
    }
    return out;
  }, [sortedStarts, cycleLength, bleedingDuration]);

  // Predicted ovulation day-keys (±1 day window around cycleLength-14 from each start, past + future)
  const ovulationSet = useMemo(() => {
    const out = new Set();
    const ovOffset = Math.max(10, cycleLength - 14);
    const allStarts = [
      ...sortedStarts.map(toDate),
      ...predictFutureStarts(sortedStarts, cycleLength, 6),
    ];
    for (const start of allStarts) {
      for (let d = -1; d <= 1; d++) out.add(dayKey(addDays(start, ovOffset - 1 + d)));
    }
    return out;
  }, [sortedStarts, cycleLength]);

  function classifyDay(date) {
    const k = dayKey(date);
    if (periodSet.has(k)) return 'period';
    if (predictedPeriodSet.has(k)) return 'predicted';
    if (ovulationSet.has(k)) return 'ovulation';
    return null;
  }

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const cls = classifyDay(date);
    if (!cls) return '';
    return `cc-${cls}`;
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const cls = classifyDay(date);
    if (!cls) return null;
    return <span className={`cc-dot cc-dot-${cls}`} aria-hidden />;
  };

  const handleDayClick = (date) => {
    setSelected(date);
    togglePeriodDay(date);
  };

  const selectedInfo = getPhaseForDate(selected);
  const selectedKey = dayKey(selected);
  const isLogged = periodSet.has(selectedKey);

  return (
    <div className="space-y-4">
      <div className="bg-phase-surface rounded-squish p-3 shadow-squish">
        <Calendar
          onClickDay={handleDayClick}
          value={selected}
          tileClassName={tileClassName}
          tileContent={tileContent}
          calendarType="iso8601"
          minDetail="month"
          prev2Label={null}
          next2Label={null}
          formatShortWeekday={(_, date) => format(date, 'EEEEE')}
        />
      </div>

      <div className="bg-phase-surface/70 rounded-squish p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-phase-muted uppercase tracking-wide">Selected</p>
            <p className="font-semibold">
              {format(selected, 'EEEE, MMM d')}
              {isSameDay(selected, new Date()) && <span className="text-phase-accent"> · today</span>}
            </p>
            <p className="text-sm text-phase-muted mt-1">
              Phase: <span className="text-phase-text font-semibold capitalize">{selectedInfo.phase}</span>
              {selectedInfo.dayInCycle && <> · Day {selectedInfo.dayInCycle}</>}
            </p>
          </div>
          <button
            onClick={() => togglePeriodDay(selected)}
            className="rounded-full px-4 py-3 min-h-[48px] bg-phase-accent text-white font-semibold shadow-squish active:scale-95 transition-transform"
          >
            {isLogged ? 'Remove 🩸' : 'Log bleeding 🩸'}
          </button>
        </div>
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    { cls: 'period', label: 'Logged period' },
    { cls: 'predicted', label: 'Predicted period' },
    { cls: 'ovulation', label: 'Ovulation window' },
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center text-xs text-phase-muted">
      {items.map((i) => (
        <span key={i.cls} className="inline-flex items-center gap-1.5">
          <span className={`cc-dot cc-dot-${i.cls} static`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
