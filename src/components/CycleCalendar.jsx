import Calendar from 'react-calendar';
import { useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { dayKey, getCycleBleedingDays, predictFutureStarts, toDate } from '../utils/cycle';

export default function CycleCalendar() {
  const {
    cycles,
    confirmedBleedingSet,
    cycleLength,
    bleedingDuration,
    addCycle,
    removeCycle,
    adjustCycleDuration,
    getPhaseForDate,
  } = useCycle();

  const [calendarDate, setCalendarDate] = useState(new Date());
  // start key of the cycle currently selected for editing, or null
  const [selectedStartKey, setSelectedStartKey] = useState(null);

  // --- calendar day classification sets ---

  const predictedPeriodSet = useMemo(() => {
    const out = new Set();
    predictFutureStarts(cycles, cycleLength, 6).forEach((start) => {
      for (let i = 0; i < bleedingDuration; i++) out.add(dayKey(addDays(start, i)));
    });
    return out;
  }, [cycles, cycleLength, bleedingDuration]);

  const ovulationSet = useMemo(() => {
    const out = new Set();
    const ovOffset = Math.max(10, cycleLength - 14);
    const allStarts = [
      ...cycles.map((c) => toDate(c.start)),
      ...predictFutureStarts(cycles, cycleLength, 6),
    ];
    allStarts.forEach((start) => {
      for (let d = -1; d <= 1; d++) out.add(dayKey(addDays(start, ovOffset - 1 + d)));
    });
    return out;
  }, [cycles, cycleLength]);

  function classifyDay(date) {
    const k = dayKey(date);
    if (confirmedBleedingSet.has(k)) return 'period';
    if (predictedPeriodSet.has(k)) return 'predicted';
    if (ovulationSet.has(k)) return 'ovulation';
    return null;
  }

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const cls = classifyDay(date);
    return cls ? `cc-${cls}` : '';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const cls = classifyDay(date);
    return cls ? <span className={`cc-dot cc-dot-${cls}`} aria-hidden /> : null;
  };

  // --- tap logic ---

  function handleDayTap(date) {
    const k = dayKey(date);
    setCalendarDate(date);

    // Find the cycle whose bleeding window contains this day.
    const owningCycle = cycles.find((c) => new Set(getCycleBleedingDays(c)).has(k));

    if (owningCycle) {
      // Select that cycle for editing — do NOT create a duplicate.
      setSelectedStartKey(owningCycle.start);
    } else {
      // Any unlogged day → new cycle starts here.
      addCycle(date);
      setSelectedStartKey(k);
    }
  }

  // --- selected cycle detail ---

  const selectedCycle = selectedStartKey
    ? cycles.find((c) => c.start === selectedStartKey) ?? null
    : null;

  const selectedDateInfo = getPhaseForDate(calendarDate);

  return (
    <div className="space-y-4">
      <div className="bg-phase-surface rounded-squish p-3 shadow-squish">
        <Calendar
          onClickDay={handleDayTap}
          value={calendarDate}
          tileClassName={tileClassName}
          tileContent={tileContent}
          calendarType="iso8601"
          minDetail="month"
          prev2Label={null}
          next2Label={null}
          formatShortWeekday={(_, date) => format(date, 'EEEEE')}
        />
      </div>

      {selectedCycle ? (
        <CycleCard
          cycle={selectedCycle}
          onAdjust={(delta) => adjustCycleDuration(selectedCycle.start, delta)}
          onDelete={() => { removeCycle(selectedCycle.start); setSelectedStartKey(null); }}
        />
      ) : (
        <DayInfoCard date={calendarDate} phaseInfo={selectedDateInfo} />
      )}

      <Legend />
    </div>
  );
}

// --- sub-components ---

function CycleCard({ cycle, onAdjust, onDelete }) {
  const start = toDate(cycle.start);
  const end = addDays(start, cycle.length - 1);
  return (
    <div className="bg-phase-surface rounded-squish p-4 shadow-squish space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-phase-muted uppercase tracking-wide">Logged period</p>
          <p className="font-semibold mt-0.5">
            {format(start, 'MMM d')} → {format(end, 'MMM d')}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete this period"
          className="text-phase-muted hover:text-phase-accent text-xl leading-none transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-phase-muted flex-1">Duration</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(-1)}
            aria-label="Shorten by one day"
            className="w-10 h-10 rounded-full bg-phase-bg font-bold text-phase-accent text-lg
                       flex items-center justify-center active:scale-95 transition-transform"
          >−</button>
          <span className="w-14 text-center font-bold text-phase-text tabular-nums">
            {cycle.length} {cycle.length === 1 ? 'day' : 'days'}
          </span>
          <button
            onClick={() => onAdjust(+1)}
            aria-label="Extend by one day"
            className="w-10 h-10 rounded-full bg-phase-bg font-bold text-phase-accent text-lg
                       flex items-center justify-center active:scale-95 transition-transform"
          >+</button>
        </div>
      </div>
    </div>
  );
}

function DayInfoCard({ date, phaseInfo }) {
  return (
    <div className="bg-phase-surface/70 rounded-squish p-4">
      <p className="text-xs text-phase-muted uppercase tracking-wide">Selected day</p>
      <p className="font-semibold mt-0.5">
        {format(date, 'EEEE, MMM d')}
        {isSameDay(date, new Date()) && <span className="text-phase-accent"> · today</span>}
      </p>
      <p className="text-sm text-phase-muted mt-1">
        Phase: <span className="text-phase-text font-semibold capitalize">{phaseInfo.phase}</span>
        {phaseInfo.dayInCycle && <> · Day {phaseInfo.dayInCycle}</>}
      </p>
      <p className="text-xs text-phase-muted mt-2">
        Tap any date to start logging a period there 🩸
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center text-xs text-phase-muted">
      {[
        { cls: 'period',    label: 'Logged period' },
        { cls: 'predicted', label: 'Predicted period' },
        { cls: 'ovulation', label: 'Ovulation window' },
      ].map(({ cls, label }) => (
        <span key={cls} className="inline-flex items-center gap-1.5">
          <span className={`cc-dot cc-dot-${cls} static`} />
          {label}
        </span>
      ))}
    </div>
  );
}
