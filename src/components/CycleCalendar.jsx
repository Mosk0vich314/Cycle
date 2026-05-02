import Calendar from 'react-calendar';
import { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useCycle } from '../context/CycleContext';
import { dayKey, predictFutureStarts, toDate } from '../utils/cycle';

function isoWeekday(date) {
  const n = toDate(date).getDay();
  return n === 0 ? 7 : n;
}

function pillClass(k, startKey, endKey, length) {
  if (length === 1) return 'period-single';
  const weekday = isoWeekday(k);
  const isMon   = weekday === 1;
  const isSun   = weekday === 7;
  const isFirst = k === startKey;
  const isLast  = k === endKey;
  const roundL  = isFirst || isMon;
  const roundR  = isLast  || isSun;
  if (roundL && roundR) return 'period-isolated';
  if (roundL)           return 'period-start';
  if (roundR)           return 'period-end';
  return 'period-mid';
}

function classifyTile(date, cycles, predictedSet, ovulationSet) {
  const k = dayKey(date);
  for (const cycle of cycles) {
    const startKey = cycle.start;
    const endKey   = dayKey(addDays(toDate(cycle.start), cycle.length - 1));
    if (k < startKey || k > endKey) continue;
    return pillClass(k, startKey, endKey, cycle.length);
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
  // null
  // { mode:'logging-start' }
  // { mode:'logging-end', startDate: Date }
  // { mode:'pending', startDate: Date, length: number }
  // { mode:'view'|'edit', cycleKey: string }
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

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const k = dayKey(date);

    // Selection preview
    if (card?.mode === 'logging-end') {
      const startKey = dayKey(card.startDate);
      if (k === startKey) return 'cc-period-isolated';
    }
    if (card?.mode === 'pending') {
      const startKey = dayKey(card.startDate);
      const endKey   = dayKey(addDays(toDate(card.startDate), card.length - 1));
      if (k >= startKey && k <= endKey) {
        return `cc-${pillClass(k, startKey, endKey, card.length)}`;
      }
    }

    const cls = classifyTile(date, cycles, predictedPeriodSet, ovulationSet);
    return cls ? `cc-${cls}` : '';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const k = dayKey(date);
    if (card?.mode === 'logging-end' || card?.mode === 'pending') return null;
    if (classifyTile(date, cycles, predictedPeriodSet, ovulationSet) !== 'ovulation') return null;
    return <span className="cc-ov-emoji" aria-hidden>✨</span>;
  };

  function handleDayTap(date) {
    const d = toDate(date);
    setCalendarDate(date);

    if (card?.mode === 'logging-start') {
      setCard({ mode: 'logging-end', startDate: d });
      return;
    }

    if (card?.mode === 'logging-end') {
      if (d >= card.startDate) {
        const length = differenceInCalendarDays(d, card.startDate) + 1;
        setCard({ mode: 'pending', startDate: card.startDate, length });
      } else {
        setCard({ mode: 'logging-end', startDate: d });
      }
      return;
    }

    if (card?.mode === 'pending') {
      if (d >= card.startDate) {
        const length = differenceInCalendarDays(d, card.startDate) + 1;
        setCard({ ...card, length });
      }
      return;
    }

    // Default: tap existing period → view it
    const owning = cycles.find((c) => {
      const s = toDate(c.start);
      const e = addDays(s, c.length - 1);
      return d >= s && d <= e;
    });
    if (owning) setCard({ mode: 'view', cycleKey: owning.start });
  }

  function handleConfirm() {
    if (card?.mode !== 'pending') return;
    addCycle(card.startDate, card.length);
    setCard({ mode: 'view', cycleKey: dayKey(card.startDate) });
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

      {!card && (
        <>
          <HintCard phaseInfo={todayPhaseInfo} />
          <button
            onClick={() => setCard({ mode: 'logging-start' })}
            className="w-full py-3 rounded-full bg-phase-accent text-white font-semibold
                       shadow-squish active:scale-95 transition-transform"
          >
            Log Period 🌸
          </button>
        </>
      )}

      {card?.mode === 'logging-start' && (
        <PromptCard
          title="Tap the first day of your period"
          onCancel={() => setCard(null)}
        />
      )}

      {card?.mode === 'logging-end' && (
        <PromptCard
          title="Now tap the last day of your period"
          subtitle={`Started: ${format(card.startDate, 'EEE, MMM d')}`}
          onCancel={() => setCard(null)}
        />
      )}

      {card?.mode === 'pending' && (
        <PendingCard
          startDate={card.startDate}
          length={card.length}
          onConfirm={handleConfirm}
          onCancel={() => setCard(null)}
        />
      )}

      {card?.mode === 'view' && activeCycle && (
        <ViewCard
          cycle={activeCycle}
          onEdit={() => setCard({ mode: 'edit', cycleKey: card.cycleKey })}
          onClose={() => setCard(null)}
        />
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

function HintCard({ phaseInfo }) {
  return (
    <div className="bg-phase-surface/60 rounded-squish p-4 text-center space-y-0.5">
      <p className="text-sm font-medium text-phase-text capitalize">
        {phaseInfo.phase} phase
        {phaseInfo.dayInCycle && <span className="text-phase-muted font-normal"> · Day {phaseInfo.dayInCycle}</span>}
      </p>
      <p className="text-xs text-phase-muted">Tap a logged period to view it, or use the button below</p>
    </div>
  );
}

function PromptCard({ title, subtitle, onCancel }) {
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-3">
      <p className="font-semibold text-phase-text">{title}</p>
      {subtitle && <p className="text-sm text-phase-muted">{subtitle}</p>}
      <button
        onClick={onCancel}
        className="text-sm text-phase-muted hover:text-phase-text transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function PendingCard({ startDate, length, onConfirm, onCancel }) {
  const endDate = addDays(startDate, length - 1);
  return (
    <div className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-phase-muted">Log period</p>
        <p className="text-lg font-bold mt-0.5">
          {format(startDate, 'MMM d')} → {format(endDate, 'MMM d')}
        </p>
        <p className="text-sm text-phase-muted mt-1">
          {length} {length === 1 ? 'day' : 'days'}
          <span className="text-xs opacity-70"> · tap a different end day to adjust</span>
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

function ViewCard({ cycle, onEdit, onClose }) {
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
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="shrink-0 px-4 py-2 rounded-full bg-phase-bg text-phase-accent
                       text-sm font-semibold active:scale-95 transition-transform"
          >
            Edit ✏️
          </button>
          <button
            onClick={onClose}
            className="shrink-0 px-3 py-2 rounded-full bg-phase-bg text-phase-muted
                       text-sm active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>
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
