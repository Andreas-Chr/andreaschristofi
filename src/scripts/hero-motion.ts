import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/** The visible words are decorative; the heading has one stable accessible name. */
export function initHeroMotion(root: HTMLElement) {
  if (root.dataset.motionInitialized) return;
  root.dataset.motionInitialized = 'true';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const words = Array.from(root.querySelectorAll<HTMLElement>('.hero-word'));
  let timeline: gsap.core.Timeline | undefined;
  let splits: SplitText[] = [];
  const sync = () => {
    if (preference.matches) {
      timeline?.revert();
      timeline = undefined;
      splits.forEach(split => split.revert());
      splits = [];
      delete root.dataset.motionReady;
    } else {
      if (!timeline && words.length) {
        splits = words.map(word => SplitText.create(word, { type: 'chars', aria: 'none' }));
        timeline = gsap.timeline({ repeat: -1, paused: true });
        words.forEach((word, index) => {
          const start = index * 3;
          timeline!
            .set(words, { opacity: 0 }, start)
            .set(word, { opacity: 1 }, start)
            .from(splits[index].chars, {
              opacity: 0, y: 30,
              duration: 0.5, stagger: 0.03,
              ease: 'back.out(1.7)',
            }, start);
        });
        // Hold the final word until the next three-second slot.
        timeline.set({}, {}, words.length * 3);
      }
      root.dataset.motionReady = 'true';
      timeline?.paused(document.hidden);
    }
    root.dataset.paused = String(document.hidden);
  };
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
