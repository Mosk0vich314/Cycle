# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — local Vite dev server.
- `npm run build` — production build to `dist/`. Runs as `predeploy`.
- `npm run preview` — serve the built `dist/` locally to verify the production bundle.
- `npm run deploy` — build + publish `dist/` to the `gh-pages` branch via `gh-pages -d dist --dotfiles`. The `--dotfiles` flag is required so `.nojekyll` is published.

There is no test suite, linter, or type-checker configured. "Verifying" a change means running `npm run build` (catches syntax / import errors) and visually confirming behavior in `npm run dev` or `preview`.

The site is published at `https://Mosk0vich314.github.io/Cycle/` — `vite.config.js` hardcodes `base: '/Cycle/'` and `start_url`/`scope` to match. If the repo is renamed, update `REPO_NAME` in `vite.config.js`.

## Architecture

Single-page React PWA. No backend, no auth — all state lives in `localStorage` under the key `cute-cycle-data-v2`.

### Data model

The single source of truth is stored in `localStorage` under `cute-cycle-data-v2`:

```js
{
  cycles: [{ start: 'YYYY-MM-DD', length: number }, ...],
  manualCycleLength: number | null,
  customPartnerTips: [{ id: string, text: string, phase: 'menstruation'|'follicular'|'ovulation'|'luteal'|'all' }, ...],
}
```

`start` is a date-only string (a logical local date, never a Date object in storage). `length` is bleeding duration in days. Predicted future cycles, ovulation windows, average cycle length, and the current phase are all *derived* from this array — never stored. `CycleContext` holds this array; `utils/cycle.js` contains the pure functions that derive everything else. Adding a feature that depends on cycle data should pull it from `useCycle()` or write a new derivation in `utils/cycle.js` rather than introducing a new persisted field.

`customPartnerTips` are messages the cycle owner writes for their partner. They are included in the Gist sync payload automatically (since the whole `data` object is pushed). In partner mode, `PhaseAdvice` filters and displays tips matching the current phase or tagged `'all'`. The girl manages them via the editor at the bottom of `PhaseAdvice` in self mode. `addCustomPartnerTip` / `removeCustomPartnerTip` are exposed from `CycleContext`.

### Timezone discipline

This app has been bitten repeatedly by `parseISO('YYYY-MM-DD')` returning UTC midnight (per the ECMAScript spec), which shifts dates by the user's UTC offset. The codebase enforces two rules:

1. `toDate()` in `utils/cycle.js` parses date-only strings via `new Date(y, m-1, d)` — local midnight, always. Use this, never `parseISO` on date-only strings.
2. `dayKey()` produces the canonical `'YYYY-MM-DD'` string in local time. Date *range comparisons* are done by lexicographic string comparison on `dayKey` values, not by comparing Date objects (e.g. `classifyTile` in `CycleCalendar.jsx`). Date objects are only used when arithmetic needs them.

### Phase theme engine

`getPhaseForDate()` returns one of `menstruation | follicular | ovulation | luteal` based on the most recent cycle that started on or before the given date. `ThemeProvider` reads the current phase from `CycleContext` and writes the palette into CSS custom properties on `:root` (`--phase-bg`, `--phase-surface`, `--phase-primary`, `--phase-accent`, `--phase-text`, `--phase-muted`) plus the `<meta name="theme-color">` tag. **All theme-aware styling — both Tailwind utilities (`bg-phase-accent`, `text-phase-muted`) and raw CSS — references these variables.** Never hardcode a pink hex anywhere; the whole point is that the UI re-tints automatically when the phase changes.

### Calendar rendering (`src/components/CycleCalendar.jsx` + `src/index.css`)

`react-calendar` is used with a full visual override in `index.css`. Three things to know:

1. **CSS specificity trap**: `.react-calendar button { background: transparent }` has specificity (0,1,1) and silently overrides single-class selectors like `.cc-period-start`. Period/predicted/ovulation tile classes use `!important` on `background` to win. If you add a new tile class, it must do the same.
2. **Pill-shape continuity**: A logged period of N consecutive days is rendered as a single pill across the calendar row. `classifyTile` returns `period-start | period-mid | period-end | period-isolated | period-single` based on whether the date is the first/last day of the cycle *and* whether it's at a row boundary (Mon/Sun, ISO weekday). The CSS combines these into asymmetric border-radius rules. The `--active` (selected) tile must keep its pill class — do not force a full circle on it, or you break the visual range.
3. **Logging UX is an explicit state machine**, not tap-to-log. The card state is one of: `null` (HintCard + Log Period button) → `{mode:'logging-start'}` → `{mode:'logging-end', startDate}` → `{mode:'pending', startDate, length}` → `{mode:'view'|'edit', cycleKey}`. Calendar taps are only interpreted as date-range selection inside the logging modes; outside them, taps only open existing periods for view/edit. Don't reintroduce auto-logging on tap.

### PWA / auto-update

`vite-plugin-pwa` with `registerType: 'autoUpdate'`, `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`. Combined with the `controllerchange` reload handler in `main.jsx`, a new deploy is picked up automatically — no hard refresh required, even on iOS PWA. `__BUILD_TIME__` is baked in at build time via `vite.config.js`'s `define` and shown in the Stats tab so a deployment can be verified visually.

PWA manifest icons use `purpose: 'any'` only — never `'maskable'`, since Brave applies an aggressive ~33% safe-zone crop to maskable icons and the logo gets butchered.

### Phase GIFs (`src/data/phaseGifs.js`)

`PHASE_GIFS` is an object keyed by phase, each value an array of `{ src, caption }` objects. The displayed GIF rotates daily via `epochDay % array.length` (UTC midnight). To add or swap GIFs, edit the array for the relevant phase — search "peach goma `<vibe>`" on Tenor and paste the media URL. The component has an `onError` fallback to 🐱 so broken URLs are safe.

### Things to avoid

- Don't reintroduce `parseISO` on date-only strings.
- Don't compare cycle dates as Date objects across timezone boundaries — use `dayKey` lexicographic comparison.
- Don't hardcode pink/phase colors — go through the CSS custom properties.
- Don't add `.cc-*` tile background rules without `!important` (specificity will lose).
- Don't make the calendar auto-log on tap.
