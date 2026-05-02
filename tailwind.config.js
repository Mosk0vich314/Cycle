/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        phase: {
          bg: 'var(--phase-bg)',
          surface: 'var(--phase-surface)',
          primary: 'var(--phase-primary)',
          accent: 'var(--phase-accent)',
          text: 'var(--phase-text)',
          muted: 'var(--phase-muted)',
        },
      },
      fontFamily: {
        cute: ['"Quicksand"', '"Comic Sans MS"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        squish: '0 8px 24px -8px var(--phase-primary)',
      },
      borderRadius: {
        squish: '1.75rem',
      },
    },
  },
  plugins: [],
};
