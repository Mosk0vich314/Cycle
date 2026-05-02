import { useMemo, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { useCycle } from './context/CycleContext';
import { PHASE_PALETTES } from './theme/palettes';
import { predictFutureStarts } from './utils/cycle';
import MochiCat from './components/MochiCat';
import BottomNav from './components/BottomNav';
import CycleCalendar from './components/CycleCalendar';
import Stats from './components/Stats';

function NextPeriodCard({ cycles, cycleLength, todayPhase, todayPhaseInfo }) {
  const nextStart = useMemo(
    () => predictFutureStarts(cycles, cycleLength, 1)[0] ?? null,
    [cycles, cycleLength],
  );

  const daysUntil = useMemo(
    () => (nextStart ? differenceInCalendarDays(nextStart, new Date()) : null),
    [nextStart],
  );

  if (todayPhase === 'menstruation') {
    return (
      <div className="bg-phase-surface rounded-squish p-4 shadow-squish text-center">
        <p className="text-xs uppercase tracking-wide text-phase-muted">Period in progress</p>
        <p className="text-2xl font-bold mt-1">
          Day {todayPhaseInfo.dayInCycle ?? '—'}
          <span className="text-base font-normal text-phase-muted"> of cycle</span>
        </p>
      </div>
    );
  }

  if (!nextStart) {
    return (
      <div className="bg-phase-surface/60 rounded-squish p-4 text-center">
        <p className="text-sm text-phase-muted">Log a period to see predictions 🌷</p>
      </div>
    );
  }

  return (
    <div className="bg-phase-surface rounded-squish p-4 shadow-squish">
      <p className="text-xs uppercase tracking-wide text-phase-muted text-center">Next period</p>
      <div className="flex items-baseline justify-center gap-2 mt-1">
        <span className="text-4xl font-bold text-phase-accent">{Math.max(0, daysUntil)}</span>
        <span className="text-phase-muted font-medium">
          {daysUntil === 1 ? 'day away' : 'days away'}
        </span>
      </div>
      <p className="text-center text-sm text-phase-muted mt-1">
        Expected {format(nextStart, 'MMMM d')}
      </p>
    </div>
  );
}

function HomeView() {
  const { todayPhase, todayPhaseInfo, cycleLength, bleedingDuration, cycles } = useCycle();
  const palette = PHASE_PALETTES[todayPhase];

  return (
    <div className="space-y-4">
      <section className="bg-phase-surface rounded-squish p-6 shadow-squish flex flex-col items-center gap-3">
        <MochiCat phase={todayPhase} size="lg" />
        <div className="text-center">
          <p className="text-sm text-phase-muted">You're in your</p>
          <p className="text-xl font-bold text-phase-accent">
            {palette.emoji} {palette.label} phase
          </p>
          {todayPhaseInfo.dayInCycle && (
            <p className="text-xs text-phase-muted mt-0.5">Day {todayPhaseInfo.dayInCycle} of cycle</p>
          )}
        </div>
      </section>

      <NextPeriodCard
        cycles={cycles}
        cycleLength={cycleLength}
        todayPhase={todayPhase}
        todayPhaseInfo={todayPhaseInfo}
      />

      <section className="grid grid-cols-2 gap-3">
        <div className="bg-phase-surface/70 rounded-squish p-4">
          <p className="text-xs uppercase tracking-wide text-phase-muted">Avg cycle</p>
          <p className="text-2xl font-bold">{cycleLength}d</p>
        </div>
        <div className="bg-phase-surface/70 rounded-squish p-4">
          <p className="text-xs uppercase tracking-wide text-phase-muted">Avg period</p>
          <p className="text-2xl font-bold">{bleedingDuration}d</p>
        </div>
      </section>
    </div>
  );
}

const HEADER_TITLES = {
  home: 'Cute Cycle',
  calendar: 'Calendar',
  stats: 'Statistics',
};

export default function App() {
  const [tab, setTab] = useState('home');
  const { todayPhase } = useCycle();
  const palette = PHASE_PALETTES[todayPhase];

  return (
    <div className="min-h-full bg-phase-bg text-phase-text font-cute">
      <header className="px-6 pt-10 pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {palette.emoji} {HEADER_TITLES[tab]}
        </h1>
        <p className="text-sm text-phase-muted mt-1">
          Phase: <span className="font-semibold text-phase-accent">{palette.label}</span>
        </p>
      </header>

      <main className="max-w-md mx-auto px-5 pb-32">
        {tab === 'home'     && <HomeView />}
        {tab === 'calendar' && <CycleCalendar />}
        {tab === 'stats'    && <Stats />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
