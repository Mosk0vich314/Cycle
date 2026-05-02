import Calendar from 'react-calendar';
import { useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { dayKey, getCycleBleedingDays, predictFutureStarts, toDate } from '../utils/cycle';

// card state shape:
//   null                                   → no card, show hint
//   { mode: 'pending', date: Date }        → tapped empty day, awaiting confirmation
//   { mode: 'view',    cycleKey: string }  → confirmed period, read-only summary
//   { mode: 'edit',    cycleKey: string }  → same period, duration controls visible

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
  const [card, setCard] = useState(null);

  // --- day classification sets (recomputed only when cycles/cycleLength/bleedingDuration change) ---

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
      .forEach((start) => {
        for (let d = -1; d <= 1; d++) out.add(dayKey(addDays(start, ovOffset - 1 + d)));
      });
    return out;
  }, [cycles, cycleLength]);

  function classifyDay(date) {
    const k = dayKey(date);
    if (confirmedBleedingSet.has(k)) return 'period';
    if (predictedPeriodSet.has(k))   return 'predicted';
    if (ovulationSet.has(k))          return 'ovulation';
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

  // --- tap handler ---

  function handleDayTap(date) {
    const k = dayKey(date);
    setCalendarDate(date);

    const owning = cycles.find((c) => new Set(getCycleBleedingDays(c)).has(k));
    if (owning) {
      // Already logged → open the read-only summary first
      setCard({ mode: 'view', cycleKey: owning.start });
    } else {
      // Empty or predicted day → ask for confirmation before writing anything
      setCard({ mode: 'pending', date });
    }
  }

  // --- card actions ---

  function handleConfirm() {
    if (card?.mode !== 'pending') return;
    addCycle(card.date);
    setCard({ mode: 'view', cycleKey: dayKey(card.date) });
  }

  function handleCancelPending() {
    setCard(null);
  }

  function handleStartEdit() {
    if (card?.mode !== 'view') return;
    setCard({ mode: 'edit', cycleKey: card.cycleKey });
  }

  function handleDoneEditing() {
    if (card?.mode !== 'edit') return;
    setCard({ mode: 'view', cycleKey: card.cycleKey });
  }

  function handleRemove(cycleKey) {
    removeCycle(cycleKey);
    setCard(null);
  }

  // The cycle object currently shown in the view/edit card
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

      {/* Bottom info / action card */}
      {!card && (
        <HintCard phaseInfo={todayPhaseInfo} />
      )}
      {card?.mode === 'pending' && (
        <PendingCard
          date={card.date}
          duration={bleedingDuration}
          onConfirm={handleConfirm}
          onCancel={handleCancelPending}
        />
      )}
      {card?.mode === 'view' && activeCycle && (
        <ViewCard cycle={activeCycle} onEdit={handleStartEdit} />
      )}
      {card?.mode === 'edit' && activeCycle && (
        <EditCard
          cycle={activeCycle}
          onAdjust={(delta) => adjustCycleDuration(activeCycle.start, delta)}
          onDone={handleDoneEditing}
          onRemove={() => handleRemove(activeCycle.start)}
        />
      )}

      <Legend />
    </div>
  );
}

// --- sub-cards ---

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
  const start = date;
  const end   = addDays(date, duration - 1);
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-phase-muted">Log period starting</p>
        <p className="text-lg font-bold mt-0.5">{format(start, 'EEEE, MMMM d')}</p>
        <p className="text-sm text-phase-muted mt-1">
          {format(start, 'MMM d')} → {format(end, 'MMM d')} · {duration} days
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
          className="px-5 py-3 rounded-full text-phase-muted font-medium
                     hover:text-phase-text transition-colors"
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
          <p className="font-bold text-lg mt-0.5">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
          </p>
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
          <p className="font-bold mt-0.5">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
          </p>
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
          <button
            onClick={() => onAdjust(-1)}
            aria-label="Shorten by one day"
            className="w-10 h-10 rounded-full bg-phase-bg text-phase-accent font-bold text-xl
                       flex items-center justify-center active:scale-95 transition-transform"
          >−</button>
          <span className="w-16 text-center font-bold tabular-nums text-phase-text">
            {cycle.length} {cycle.length === 1 ? 'day' : 'days'}
          </span>
          <button
            onClick={() => onAdjust(+1)}
            aria-label="Extend by one day"
            className="w-10 h-10 rounded-full bg-phase-bg text-phase-accent font-bold text-xl
                       flex items-center justify-center active:scale-95 transition-transform"
          >+</button>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="w-full text-center text-xs text-phase-muted/60 hover:text-phase-muted
                   py-1 transition-colors"
      >
        Remove this period
      </button>
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
