import { useState } from 'react';
import { useCycle } from '../context/CycleContext';

const PHASE_ADVICE = {
  menstruation: {
    nutrition:
      'Focus on iron-rich foods (spinach, lentils, red meat) and Vitamin C to help absorption. Add anti-inflammatory foods like omega-3s (salmon, chia seeds) and dark chocolate (magnesium) for cramps. Warm, comforting foods are best.',
    movement:
      'Energy is at its lowest. Stick to gentle movement like yin yoga, light walks, and stretching. Rest is highly productive right now.',
    selfCare:
      'Prioritize sleep, alone time, and journaling. Be gentle with yourself.',
  },
  follicular: {
    nutrition:
      'Estrogen is rising. Support it with fresh, light foods, vibrant salads, fermented foods (kimchi, kombucha), and lean proteins to support developing follicles.',
    movement:
      'Your energy is returning and building up! Great time for cardio, dancing, running, or trying out a completely new workout class.',
    selfCare:
      'Brain power and creativity are high. Brainstorm new projects, socialize, and set intentions for the month.',
  },
  ovulation: {
    nutrition:
      'Estrogen peaks. Focus on fiber-rich foods (broccoli, cauliflower, kale) to help the body flush out excess estrogen. Add nuts and seeds for sustained energy.',
    movement:
      'Energy and strength are at their absolute peak! Go for high-intensity workouts (HIIT), heavy weightlifting, or group sports.',
    selfCare:
      'You are naturally most magnetic and communicative right now. Schedule important conversations, dates, and social events.',
  },
  luteal: {
    nutrition:
      'Progesterone rises, which can increase appetite and cravings. Eat complex carbs (sweet potatoes, brown rice, oats) to stabilize blood sugar and mood. Eat warm, cooked root vegetables.',
    movement:
      'For the first half, moderate strength training is fine. For the second half (days before period), scale back to Pilates, yoga, or swimming as energy naturally dips.',
    selfCare:
      'Nesting mode. Focus on wrapping up projects, organizing your space, and preparing for rest.',
  },
};

const PARTNER_ADVICE = {
  menstruation: {
    mission: 'She is bleeding, tired, and likely cramping. Make her life as easy as possible.',
    action:  'Bring her a hot water bottle, snacks, and handle the chores.',
    vibe:    'Give her lots of cuddles and extra "pat-pats". Do not take low energy personally.',
  },
  follicular: {
    mission: 'Her energy is bouncing back and she is feeling creative!',
    action:  'Perfect time to plan a fun surprise date or an outdoor activity.',
    vibe:    'Hype up her new ideas and match her returning positive energy.',
  },
  ovulation: {
    mission: 'She is at her absolute peak energy and feeling magnetic.',
    action:  'Take her out somewhere nice. Shower her with genuine compliments.',
    vibe:    'Romance and socializing. Keep up with her high energy!',
  },
  luteal: {
    mission: 'Welcome to the PMS zone. Hormones are dropping. She might be easily annoyed or, in her own words, "a pain in the ass".',
    action:  'Order her favorite comfort food. Listen to her vent without trying to "fix" it.',
    vibe:    'Extreme patience. Validate her feelings, do not argue, and administer frequent, copious amounts of "pat-pats".',
  },
};

const SELF_SECTIONS = [
  { key: 'nutrition', label: 'Nutrition', emoji: '🥑' },
  { key: 'movement',  label: 'Movement',  emoji: '🧘‍♀️' },
  { key: 'selfCare',  label: 'Self-Care', emoji: '🛁' },
];

const PARTNER_SECTIONS = [
  { key: 'mission', label: 'Mission', emoji: '🎯' },
  { key: 'action',  label: 'Action',  emoji: '💝' },
  { key: 'vibe',    label: 'Vibe',    emoji: '🌷' },
];

const PHASES = [
  { value: 'all',          label: 'Every phase' },
  { value: 'menstruation', label: 'Menstruation 🌸' },
  { value: 'follicular',   label: 'Follicular 🌿' },
  { value: 'ovulation',    label: 'Ovulation ✨' },
  { value: 'luteal',       label: 'Luteal 🍑' },
];

function CustomTipEditor({ onClose }) {
  const { addCustomPartnerTip } = useCycle();
  const [text, setText]   = useState('');
  const [phase, setPhase] = useState('all');

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addCustomPartnerTip(trimmed, phase);
    onClose();
  }

  return (
    <div className="bg-phase-bg/60 rounded-2xl p-3 space-y-2">
      <textarea
        autoFocus
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Bring me a hot chocolate and don't touch the remote 🍫"
        className="w-full bg-phase-surface/80 rounded-xl px-3 py-2 text-sm text-phase-text
                   border border-phase-primary/30 focus:outline-none focus:border-phase-accent
                   resize-none placeholder:text-phase-muted/60"
      />
      <div className="flex items-center gap-2">
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="flex-1 bg-phase-surface/80 rounded-xl px-2 py-1.5 text-xs text-phase-text
                     border border-phase-primary/30 focus:outline-none focus:border-phase-accent"
        >
          {PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="rounded-xl bg-phase-accent px-3 py-1.5 text-xs font-semibold text-white
                     disabled:opacity-40 active:scale-95 transition-transform"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="rounded-xl bg-phase-surface px-3 py-1.5 text-xs text-phase-muted
                     active:scale-95 transition-transform"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CustomTipsManager({ phase }) {
  const { customPartnerTips, removeCustomPartnerTip } = useCycle();
  const [adding, setAdding] = useState(false);

  const tips = customPartnerTips.filter((t) => t.phase === phase || t.phase === 'all');
  const phaseLabel = PHASES.find((p) => p.value === phase)?.label ?? phase;

  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs font-bold text-phase-accent flex items-center gap-1.5">
        <span aria-hidden>📝</span>
        Notes for your partner
      </p>

      {customPartnerTips.length === 0 && !adding && (
        <p className="text-xs text-phase-muted/70 italic">
          No custom notes yet — add one and your partner will see it after the next sync.
        </p>
      )}

      {customPartnerTips.map((tip) => {
        const label = PHASES.find((p) => p.value === tip.phase)?.label ?? tip.phase;
        return (
          <div
            key={tip.id}
            className="flex items-start gap-2 bg-phase-bg/60 rounded-2xl px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-phase-text/90 leading-relaxed">{tip.text}</p>
              <p className="text-xs text-phase-muted/70 mt-0.5">{label}</p>
            </div>
            <button
              onClick={() => removeCustomPartnerTip(tip.id)}
              aria-label="Remove tip"
              className="shrink-0 text-phase-muted/50 hover:text-phase-accent text-base leading-none
                         active:scale-90 transition-transform mt-0.5"
            >
              ×
            </button>
          </div>
        );
      })}

      {adding
        ? <CustomTipEditor onClose={() => setAdding(false)} />
        : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-2xl border border-dashed border-phase-primary/40
                       py-2 text-xs text-phase-muted hover:border-phase-accent hover:text-phase-accent
                       transition-colors active:scale-95"
          >
            + Add note for partner
          </button>
        )
      }
    </div>
  );
}

export default function PhaseAdvice({ phase }) {
  const { isPartnerMode, customPartnerTips } = useCycle();

  const advice   = isPartnerMode
    ? (PARTNER_ADVICE[phase] ?? PARTNER_ADVICE.follicular)
    : (PHASE_ADVICE[phase]   ?? PHASE_ADVICE.follicular);
  const sections = isPartnerMode ? PARTNER_SECTIONS : SELF_SECTIONS;
  const heading  = isPartnerMode ? '💕 Partner Survival Guide' : '✨ Your Body Right Now';
  const eyebrow  = isPartnerMode ? 'For her partner' : 'Cycle syncing guide';

  const partnerCustomTips = isPartnerMode
    ? (customPartnerTips ?? []).filter((t) => t.phase === phase || t.phase === 'all')
    : [];

  return (
    <section className="bg-phase-surface rounded-squish p-5 shadow-squish space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide text-phase-muted">{eyebrow}</p>
        <h2 className="text-lg font-bold text-phase-accent mt-0.5">{heading}</h2>
      </div>

      <div className="space-y-3">
        {sections.map(({ key, label, emoji }) => (
          <div key={key} className="bg-phase-bg/60 rounded-2xl p-3">
            <p className="text-sm font-bold text-phase-accent flex items-center gap-1.5">
              <span aria-hidden>{emoji}</span>
              {label}
            </p>
            <p className="text-sm text-phase-text/90 leading-relaxed mt-1">
              {advice[key]}
            </p>
          </div>
        ))}

        {partnerCustomTips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-phase-accent flex items-center gap-1.5">
              <span aria-hidden>💌</span>
              From her, just for you
            </p>
            {partnerCustomTips.map((tip) => (
              <div key={tip.id} className="bg-phase-bg/60 rounded-2xl p-3">
                <p className="text-sm text-phase-text/90 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isPartnerMode && (
        <div className="border-t border-phase-primary/20 pt-3">
          <CustomTipsManager phase={phase} />
        </div>
      )}
    </section>
  );
}
