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

export default function PhaseAdvice({ phase }) {
  const { isPartnerMode } = useCycle();

  const advice   = isPartnerMode
    ? (PARTNER_ADVICE[phase] ?? PARTNER_ADVICE.follicular)
    : (PHASE_ADVICE[phase]   ?? PHASE_ADVICE.follicular);
  const sections = isPartnerMode ? PARTNER_SECTIONS : SELF_SECTIONS;
  const heading  = isPartnerMode ? '💕 Partner Survival Guide' : '✨ Your Body Right Now';
  const eyebrow  = isPartnerMode ? 'For her partner' : 'Cycle syncing guide';

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
      </div>
    </section>
  );
}
