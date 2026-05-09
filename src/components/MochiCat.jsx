import PHASE_GIFS from '../data/phaseGifs';

// Advances each day (UTC midnight) so the GIF quietly rotates without user action.
const epochDay = Math.floor(Date.now() / 86_400_000);

export default function MochiCat({ phase, size = 'md' }) {
  const gifs = PHASE_GIFS[phase] ?? PHASE_GIFS.menstruation;
  const gif  = gifs[epochDay % gifs.length];
  const dim  = size === 'lg' ? 180 : size === 'sm' ? 88 : 132;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full bg-phase-surface shadow-squish overflow-hidden ring-4 ring-phase-accent"
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
