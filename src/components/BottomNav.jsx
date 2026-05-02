const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="bg-phase-surface/95 backdrop-blur rounded-full shadow-squish ring-1 ring-phase-primary/30 flex items-center justify-around p-1.5">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-0.5',
                  'min-h-[56px] rounded-full text-xs font-semibold',
                  'transition-transform active:scale-95',
                  isActive
                    ? 'bg-phase-primary text-phase-text shadow-md'
                    : 'text-phase-muted hover:text-phase-text',
                ].join(' ')}
              >
                <span className="text-xl leading-none" aria-hidden>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
