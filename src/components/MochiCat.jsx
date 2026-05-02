// Swap these Tenor URLs out for whichever Peachu & Goma GIFs you prefer — search "mochi peach cat <vibe>" on Tenor.
const PHASE_GIFS = {
  menstruation: {
    src: 'https://media.tenor.com/Hk_3qK7VyKAAAAAi/peach-and-goma-mochi-cat.gif',
    caption: 'Cuddle in. You\'re doing great. 🌸',
  },
  follicular: {
    src: 'https://media.tenor.com/8m6X4F-vR9AAAAAi/peach-cat-flowers.gif',
    caption: 'Fresh start energy! 🌿',
  },
  ovulation: {
    src: 'https://media.tenor.com/9vY9Tn5Y9wEAAAAi/peach-cat-dance.gif',
    caption: 'Sparkle mode: ON ✨',
  },
  luteal: {
    src: 'https://media.tenor.com/q0t5h6cBoO0AAAAi/peach-cat-cozy.gif',
    caption: 'Cozy peachy vibes 🍑',
  },
};

export default function MochiCat({ phase, size = 'md' }) {
  const gif = PHASE_GIFS[phase] ?? PHASE_GIFS.menstruation;
  const dim = size === 'lg' ? 180 : size === 'sm' ? 88 : 132;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full bg-phase-surface shadow-squish overflow-hidden ring-4 ring-phase-primary/40"
        style={{ width: dim, height: dim }}
      >
        <img
          src={gif.src}
          alt="Mochi Peach Cat companion"
          width={dim}
          height={dim}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.replaceWith(Object.assign(document.createElement('div'), {
              className: 'w-full h-full grid place-items-center text-5xl',
              textContent: '🐱',
            }));
          }}
        />
      </div>
      <p className="text-sm text-phase-muted font-medium">{gif.caption}</p>
    </div>
  );
}
