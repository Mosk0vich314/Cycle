// Add or swap GIFs per phase here — search "peach goma <vibe>" on Tenor and paste the media URL.
// Each phase rotates through its list daily (one new GIF per UTC day).
const PHASE_GIFS = {
  menstruation: [
    { src: '/Cycle/gifs/menstruation/menstruation-1.gif', caption: 'Cuddle in. You\'re doing great. 🌸' },
    { src: '/Cycle/gifs/menstruation/menstruation-2.gif', caption: 'Rest is productive too. 💤' },
    { src: '/Cycle/gifs/menstruation/menstruation-3.gif', caption: 'Permission to do absolutely nothing. 🛋️' },
  ],
  follicular: [
    { src: '/Cycle/gifs/follicular/follicular-1.gif', caption: 'Fresh start energy! 🌿' },
    { src: '/Cycle/gifs/follicular/follicular-2.gif', caption: 'New chapter, new vibes! 🌱' },
    { src: '/Cycle/gifs/follicular/follicular-3.gif', caption: 'Your glow-up era is loading ✨' },
  ],
  ovulation: [
    { src: '/Cycle/gifs/ovulation/ovulation-1.gif', caption: 'Sparkle mode: ON ✨' },
    { src: '/Cycle/gifs/ovulation/ovulation-2.gif', caption: 'Peak you, peak day 🌟' },
    { src: '/Cycle/gifs/ovulation/ovulation-3.gif', caption: 'You\'re magnetic today 💫' },
  ],
  luteal: [
    { src: '/Cycle/gifs/luteal/follicular-2.gif',        caption: 'Cozy peachy vibes 🍑' },
    { src: '/Cycle/gifs/luteal/peach-goma-kiss-new.gif', caption: 'Nesting mode activated 🫶' },
    { src: '/Cycle/gifs/luteal/peach-goma.gif',          caption: 'Almost there, you\'ve got this 🌙' },
  ],
};

export default PHASE_GIFS;
