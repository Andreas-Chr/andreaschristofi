/** Shared, interruptible state transition. Focus and interactivity change immediately. */
export function resizeCards(cards: HTMLElement[], update: () => void, animate = true) {
  const heights = cards.map(card => card.getBoundingClientRect().height);
  cards.forEach(card => card.getAnimations().forEach(animation => animation.cancel()));
  update();
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cards.forEach((card, i) => {
    const height = card.getBoundingClientRect().height;
    if (Math.abs(height - heights[i]) < 1 || !card.animate) return;
    const css = getComputedStyle(card);
    card.animate([{height:`${heights[i]}px`},{height:`${height}px`}], {
      duration:parseFloat(css.getPropertyValue('--primitive-animation-duration-standard')) || 240,
      easing:css.getPropertyValue('--primitive-animation-easing-standard').trim() || 'ease-out',
    });
  });
}

export function setPanel(panel: HTMLElement, trigger: HTMLButtonElement, open: boolean, animate = true) {
  panel.getAnimations().forEach(animation => animation.cancel());
  if (!open && panel.contains(document.activeElement)) trigger.focus({ preventScroll: true });
  trigger.setAttribute('aria-expanded', String(open));
  panel.inert = !open;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reduced || !panel.animate) { panel.hidden = !open; return; }
  if (open) panel.hidden = false;
  const css = getComputedStyle(panel);
  const duration = parseFloat(css.getPropertyValue('--primitive-animation-duration-standard')) || 240;
  const easing = css.getPropertyValue('--primitive-animation-easing-standard').trim() || 'ease-out';
  const animation = panel.animate(open
    ? [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }]
    : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }],
    { duration, easing });
  animation.finished.then(() => { if (trigger.getAttribute('aria-expanded') === 'false') panel.hidden = true; }).catch(() => {});
}
