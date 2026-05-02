import Calendar from 'react-calendar';
import { useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { dayKey, predictFutureStarts, toDate } from '../utils/cycle';

// ISO weekday: Mon=1 … Sun=7
function isoWeekday(date) {
  const n = toDate(date).getDay();
  return n === 0 ? 7 : n;
}

// Classify a calendar tile into a CSS modifier.
// Confirmed periods: returns 'period-start' | 'period-mid' | 'period-end'
//                           | 'period-single' | 'period-isolated'
// (row-wrap aware so the pill shape resets at each Monday / Sunday boundary)
// Other:           'predicted' | 'ovulation' | null
function classifyTile(date, cycles, predictedSet, ovulationSet) {
  const d       = toDate(date);
  const k       = dayKey(d);
  const weekday = isoWeekday(d);
  const isMon   = weekday === 1;
  const isSun   = weekday === 7;

  for (const cycle of cycles) {
    const start = toDate(cycle.start);
    const end   = addDays(start, cycle.length - 1);
    if (d < start || d > end) continue;

    if (cycle.length === 1) return 'period-single';

    const isFirstDay = k === dayKey(start);
    const isLastDay  = k === dayKey(end);
    const roundLeft  = isFirstDay || isMon;
    const roundRight = isLastDay  || isSun;

    if (roundLeft && roundRight) return 'period-isolated';
    if (roundLeft)               return 'period-start';
    if (roundRight)              return 'period-end';
    return 'period-mid';
  }

  if (predictedSet.has(k)) return 'predicted';
  if (ovulationSet.has(k)) return 'ovulation';
  return null;
}

export default function CycleCalendar() {
  const {
    cycles,
    cycleLength,
    bleedingDuration,
    addCycle,
    removeCycle,
    adjustCycleDuration,
    getPhaseForDate,
  } = useCycle();

  const [calendarDate, setCalendarDate] = useState(new Date());
  // null | { mode:'pending', date } | { mode:'view'|'edit', cycleKey }
  const [card, setCard] = useState(null);

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
    [...cycles.map((c) => toDate(c.start)), ...predictFutureStarts(cycles, cycleLength, 6)]
      .forEach((s) => {
        for (let d = -1; d <= 1; d++) out.add(dayKey(addDays(s, ovOffset - 1 + d)));
      });
    return out;
  }, [cycles, cycleLength]);

  const classify = (date) => classifyTile(date, cycles, predictedPeriodSet, ovulationSet);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const cls = classify(date);
    return cls ? `cc-${cls}` : '';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    if (classify(date) !== 'ovulation') return null;
    return <span className="cc-ov-emoji" aria-hidden>✨</span>;
  };

  // --- tap: direct date-range lookup, no set dependency ---
  function handleDayTap(date) {
    const d = toDate(date);
    setCalendarDate(date);

    const owning = cycles.find((c) => {
      const s = toDate(c.start);
      const e = addDays(s, c.length - 1);
      return d >= s && d <= e;
    });

    if (owning) setCard({ mode: 'view', cycleKey: owning.start });
    else        setCard({ mode: 'pending', date });
  }

  function handleConfirm() {
    if (card?.mode !== 'pending') return;
    addCycle(card.date);
    setCard({ mode: 'view', cycleKey: dayKey(card.date) });
  }

  const activeCycle =
    card?.mode === 'view' || card?.mode === 'edit'
      ? cycles.find((c) => c.start === card.cycleKey) ?? null
      : null;

  const todayPhaseInfo = getPhaseForDate(new Date());

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

      {!card && <HintCard phaseInfo={todayPhaseInfo} />}

      {card?.mode === 'pending' && (
        <PendingCard
          date={card.date}
          duration={bleedingDuration}
          onConfirm={handleConfirm}
          onCancel={() => setCard(null)}
        />
      )}
      {card?.mode === 'view' && activeCycle && (
        <ViewCard cycle={activeCycle} onEdit={() => setCard({ mode: 'edit', cycleKey: card.cycleKey })} />
      )}
      {card?.mode === 'edit' && activeCycle && (
        <EditCard
          cycle={activeCycle}
          onAdjust={(delta) => adjustCycleDuration(activeCycle.start, delta)}
          onDone={() => setCard({ mode: 'view', cycleKey: card.cycleKey })}
          onRemove={() => { removeCycle(activeCycle.start); setCard(null); }}
        />
      )}

      <Legend />
    </div>
  );
}

// --- sub-cards (unchanged from previous version) ---

function HintCard({ phaseInfo }) {
  return (
    <div className="bg-phase-surface/60 rounded-squish p-4 text-center space-y-0.5">
      <p className="text-sm font-medium text-phase-text capitalize">
        {phaseInfo.phase} phase
        {phaseInfo.dayInCycle && <span className="text-phase-muted font-normal"> · Day {phaseInfo.dayInCycle}</span>}
      </p>
      <p className="text-xs text-phase-muted">Tap any day to log a period 🌸</p>
    </div>
  );
}

function PendingCard({ date, duration, onConfirm, onCancel }) {
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-phase-muted">Log period starting</p>
        <p className="text-lg font-bold mt-0.5">{format(date, 'EEEE, MMMM d')}</p>
        <p className="text-sm text-phase-muted mt-1">
          {format(date, 'MMM d')} → {format(addDays(date, duration - 1), 'MMM d')} · {duration} days
          <span className="text-xs opacity-70"> (adjustable after logging)</span>
        </p>
      </div>
      <div className="flex gap-3 items-center">
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-full bg-phase-accent text-white font-semibold
                     shadow-squish active:scale-95 transition-transform"
        >
          Confirm 🌸
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3 rounded-full text-phase-muted font-medium hover:text-phase-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ViewCard({ cycle, onEdit }) {
  const start = toDate(cycle.start);
  const end   = addDays(start, cycle.length - 1);
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-phase-muted">Logged period</p>
          <p className="font-bold text-lg mt-0.5">{format(start, 'MMM d')} – {format(end, 'MMM d')}</p>
          <p className="text-sm text-phase-muted mt-0.5">{cycle.length} days</p>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 px-4 py-2 rounded-full bg-phase-bg text-phase-accent
                     text-sm font-semibold active:scale-95 transition-transform"
        >
          Edit ✏️
        </button>
      </div>
    </div>
  );
}

function EditCard({ cycle, onAdjust, onDone, onRemove }) {
  const start = toDate(cycle.start);
  const end   = addDays(start, cycle.length - 1);
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-phase-muted">Editing period</p>
          <p className="font-bold mt-0.5">{format(start, 'MMM d')} – {format(end, 'MMM d')}</p>
        </div>
        <button
          onClick={onDone}
          className="shrink-0 px-4 py-2 rounded-full bg-phase-accent text-white
                     text-sm font-semibold active:scale-95 transition-transform"
        >
          Done ✓
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-phase-muted">Duration</span>
        <div className="flex items-center gap-3">
          <button onClick={() => onAdjust(-1)}
            className="w-10 h-10 rounded-full bg-phase-bg text-phase-accent font-bold text-xl
                       flex items-center justify-center active:scale-95 transition-transform">−</button>
          <span className="w-16 text-center font-bold tabular-nums text-phase-text">
            {cycle.length} {cycle.length === 1 ? 'day' : 'days'}
          </span>
          <button onClick={() => onAdjust(+1)}
            className="w-10 h-10 rounded-full bg-phase-bg text-phase-accent font-bold text-xl
                       flex items-center justify-center active:scale-95 transition-transform">+</button>
        </div>
      </div>
      <button onClick={onRemove}
        className="w-full text-center text-xs text-phase-muted/60 hover:text-phase-muted py-1 transition-colors">
        Remove this period
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs text-phase-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="cc-legend-period" />
        Logged period
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="cc-legend-predicted" />
        Predicted period
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="cc-legend-ovulation">✨</span>
        Ovulation window
      </span>
    </div>
  );
}
