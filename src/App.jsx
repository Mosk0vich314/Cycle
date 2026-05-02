import { useState } from 'react';
import { useCycle } from './context/CycleContext';
import { PHASE_PALETTES } from './theme/palettes';
import MochiCat from './components/MochiCat';
import BottomNav from './components/BottomNav';
import CycleCalendar from './components/CycleCalendar';
import Stats from './components/Stats';

function HomeView() {
  const { todayPhase, todayPhaseInfo, cycleLength, bleedingDuration } = useCycle();
  const palette = PHASE_PALETTES[todayPhase];

  return (
    <div className="space-y-5">
      <section className="bg-phase-surface rounded-squish p-6 shadow-squish flex flex-col items-center gap-4">
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
        {tab === 'home' && <HomeView />}
        {tab === 'calendar' && <CycleCalendar />}
        {tab === 'stats' && <Stats />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
