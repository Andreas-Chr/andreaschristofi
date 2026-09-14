/** The visible words are decorative; the heading has one stable accessible name. */
export function initHeroMotion(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('.hero-motion-control');
  if (!button || root.dataset.motionInitialized) return;
  root.dataset.motionInitialized = 'true';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  const sync = () => {
    if (preference.matches) delete root.dataset.motionReady;
    else root.dataset.motionReady = 'true';
    root.dataset.paused = String(paused || document.hidden);
    button.hidden = preference.matches;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Resume headline animation' : 'Pause headline animation');
    button.textContent = paused ? 'Resume animation' : 'Pause animation';
  };
  button.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
