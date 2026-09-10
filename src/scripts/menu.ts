/** Reveal the menu from its trigger without scaling or distorting the text. */
export function setMenuPanel(panel: HTMLElement, trigger: HTMLButtonElement, open: boolean, animate = true) {
  const wasHidden = panel.hidden;
  const items = [...panel.querySelectorAll<HTMLElement>('nav li, .menu-contact, .menu-social')];
  const current = getComputedStyle(panel);
  const from = { clipPath: current.clipPath, opacity: current.opacity };
  const itemFrames = items.map(item => {
    const css = getComputedStyle(item);
    return { opacity: css.opacity, transform: css.transform };
  });
  panel.getAnimations().forEach(animation => animation.cancel());
  items.forEach(item => item.getAnimations().forEach(animation => animation.cancel()));
  if (!open && panel.contains(document.activeElement)) trigger.focus({ preventScroll: true });
  trigger.setAttribute('aria-expanded', String(open));
  panel.inert = !open;
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate) {
    panel.hidden = !open;
    return;
  }
  panel.hidden = false;
  const rect = panel.getBoundingClientRect();
  const button = trigger.getBoundingClientRect();
  const collapsed = `inset(${Math.max(0, button.top - rect.top)}px ${Math.max(0, rect.right - button.right)}px ${Math.max(0, rect.bottom - button.bottom)}px ${Math.max(0, button.left - rect.left)}px round 8px)`;
  const expanded = 'inset(0px 0px 0px 0px round 16px)';
  const easing = 'cubic-bezier(.22, 1, .36, 1)';
  const shell = panel.animate([
    wasHidden ? { clipPath: collapsed, opacity: 0 } : { ...from, clipPath: from.clipPath === 'none' ? expanded : from.clipPath },
    { clipPath: open ? expanded : collapsed, opacity: open ? 1 : 0 },
  ], { duration: open ? 500 : 280, easing, fill: 'both' });
  const content = items.map((item, index) => {
    return item.animate([
      wasHidden ? { opacity: 0, transform: 'translateX(-16px)' } : itemFrames[index],
      { opacity: open ? 1 : 0, transform: open ? 'translateX(0)' : 'translateX(-8px)' },
    ], { duration: open ? 400 : 140, delay: open && wasHidden ? 100 + index * 45 : 0, easing, fill: 'both' });
  });
  shell.finished.then(() => {
    if (trigger.getAttribute('aria-expanded') === 'false') panel.hidden = true;
  }).catch(() => {});
  // Keep content hidden throughout collapse, then release completed effects.
  Promise.all([shell, ...content].map(animation => animation.finished)).then(() => {
    [shell, ...content].forEach(animation => animation.cancel());
  }).catch(() => {});
}
