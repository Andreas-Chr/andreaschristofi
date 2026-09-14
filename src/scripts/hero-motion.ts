/** The visible words are decorative; the heading has one stable accessible name. */
export function initHeroMotion(root: HTMLElement) {
  if (root.dataset.motionInitialized) return;
  root.dataset.motionInitialized = 'true';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    if (preference.matches) delete root.dataset.motionReady;
    else root.dataset.motionReady = 'true';
    root.dataset.paused = String(document.hidden);
  };
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
