import { format } from 'date-fns';
import { differenceInCalendarDays } from 'date-fns';
import { useState } from 'react';
import { useCycle } from '../context/CycleContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { regularityLabel, toDate } from '../utils/cycle';
import { pushToGist, pullFromGist, TOKEN_KEY, GIST_KEY } from '../services/sync';

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-phase-surface rounded-squish p-4 shadow-squish">
      <p className="text-xs uppercase tracking-wide text-phase-muted">{label}</p>
      <p className="text-2xl font-bold text-phase-text mt-1">{value}</p>
      {hint && <p className="text-xs text-phase-muted mt-1">{hint}</p>}
    </div>
  );
}

function PartnerSync() {
  const { data, replaceAll, isPartnerMode, setPartnerMode } = useCycle();
  const [token, setToken]   = useLocalStorage(TOKEN_KEY, '');
  const [gistId, setGistId] = useLocalStorage(GIST_KEY, '');
  const [busy, setBusy]     = useState(null); // 'push' | 'pull' | null
  const [status, setStatus] = useState(null); // { kind:'ok'|'err', msg }

  async function handlePush() {
    setBusy('push'); setStatus(null);
    try {
      await pushToGist({
        token, gistId,
        payload: { ...data, syncedAt: new Date().toISOString(), schema: 1 },
      });
      setStatus({ kind: 'ok', msg: 'Pushed to Gist 🌸' });
    } catch (e) {
      setStatus({ kind: 'err', msg: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function handlePull() {
    setBusy('pull'); setStatus(null);
    try {
      const remote = await pullFromGist({ token, gistId });
      replaceAll(remote);
      setStatus({ kind: 'ok', msg: 'Pulled from Gist ✓' });
    } catch (e) {
      setStatus({ kind: 'err', msg: e.message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-phase-surface/70 rounded-squish p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Partner Sync</h3>
        <p className="text-xs text-phase-muted mt-0.5">
          Share a private GitHub Gist as a sync point. Token needs the <code>gist</code> scope only.
        </p>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-phase-muted">GitHub Token</span>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_…"
          className="mt-1 w-full rounded-2xl bg-phase-bg px-3 py-2 text-sm text-phase-text
                     border border-phase-primary/30 focus:outline-none focus:border-phase-accent"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-phase-muted">Gist ID</span>
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={gistId}
          onChange={(e) => setGistId(e.target.value)}
          placeholder="e.g. a1b2c3d4e5f6…"
          className="mt-1 w-full rounded-2xl bg-phase-bg px-3 py-2 text-sm text-phase-text
                     border border-phase-primary/30 focus:outline-none focus:border-phase-accent"
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={handlePush}
          disabled={busy !== null || isPartnerMode}
          className="flex-1 py-2.5 rounded-full bg-phase-accent text-white text-sm font-semibold
                     shadow-squish active:scale-95 transition-transform
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'push' ? 'Pushing…' : 'Push to Cloud ☁️↑'}
        </button>
        <button
          onClick={handlePull}
          disabled={busy !== null}
          className="flex-1 py-2.5 rounded-full bg-phase-bg text-phase-accent text-sm font-semibold
                     border border-phase-accent/40 active:scale-95 transition-transform
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'pull' ? 'Pulling…' : 'Pull from Cloud ☁️↓'}
        </button>
      </div>

      {isPartnerMode && (
        <p className="text-xs text-phase-muted/80">
          Push is disabled in partner read-only mode.
        </p>
      )}

      {status && (
        <p className={`text-xs ${status.kind === 'ok' ? 'text-phase-accent' : 'text-red-400'}`}>
          {status.msg}
        </p>
      )}

      <label className="flex items-center justify-between gap-3 pt-2 border-t border-phase-primary/20">
        <span className="text-sm text-phase-text">
          I am the Partner (read-only mode)
          <span className="block text-xs text-phase-muted font-normal">
            Disables logging & editing on this device.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isPartnerMode}
          onClick={() => setPartnerMode(!isPartnerMode)}
          className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${
            isPartnerMode ? 'bg-phase-accent' : 'bg-phase-bg border border-phase-primary/40'
          }`}
        >
          <span
            className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
              isPartnerMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>
    </div>
  );
}

export default function Stats() {
  const { cycles, cycleLength, bleedingDuration, stdDev, todayPhaseInfo, reset, isPartnerMode } = useCycle();
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

      <PartnerSync />

      <p className="text-center text-xs text-phase-muted/50">
        v{new Date(__BUILD_TIME__).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {!isPartnerMode && (
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
      )}
    </div>
  );
}
