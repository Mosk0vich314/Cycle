// Phase color palettes — each maps to CSS variables consumed via Tailwind's `phase-*` colors.
export const PHASE_PALETTES = {
  menstruation: {
    label: 'Menstruation',
    emoji: '🌸',
    vars: {
      '--phase-bg': '#fff0f3',
      '--phase-surface': '#ffd9e2',
      '--phase-primary': '#ffb3c6',
      '--phase-accent': '#ff6b8a',
      '--phase-text': '#5b2a3a',
      '--phase-muted': '#a87689',
    },
  },
  follicular: {
    label: 'Follicular',
    emoji: '🌿',
    vars: {
      '--phase-bg': '#f0fbf4',
      '--phase-surface': '#d6f5e0',
      '--phase-primary': '#a8e6c1',
      '--phase-accent': '#5fc98f',
      '--phase-text': '#21513a',
      '--phase-muted': '#6b9c83',
    },
  },
  ovulation: {
    label: 'Ovulation',
    emoji: '✨',
    vars: {
      '--phase-bg': '#f3f0ff',
      '--phase-surface': '#e3dcff',
      '--phase-primary': '#c4b6ff',
      '--phase-accent': '#8b7bff',
      '--phase-text': '#34256b',
      '--phase-muted': '#7d72b0',
    },
  },
  luteal: {
    label: 'Luteal',
    emoji: '🍑',
    vars: {
      '--phase-bg': '#fff5ec',
      '--phase-surface': '#ffe1c7',
      '--phase-primary': '#ffc89a',
      '--phase-accent': '#ff9656',
      '--phase-text': '#5e3318',
      '--phase-muted': '#a87b5d',
    },
  },
};

export const DEFAULT_PHASE = 'menstruation';
