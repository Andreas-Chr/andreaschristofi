/** Interruptible footer expansion; keep the closing card visible until it collapses. */
export function setContactPanel(root: HTMLElement, open: boolean, animate = true, focus = true) {
  const trigger = root.querySelector<HTMLButtonElement>('.contact-trigger')!;
  const panel = root.querySelector<HTMLElement>('.contact-panel')!;
  const close = root.querySelector<HTMLButtonElement>('.contact-close')!;
  const icon = close.querySelector<HTMLElement>('img')!;
  const arrow = trigger.querySelector<HTMLElement>('img')!;
  const items = [...panel.querySelectorAll<HTMLElement>(':scope > p, :scope > .social-links')];
  const wasHidden = panel.hidden;
  const snapshot = (element: HTMLElement) => {
    const css = getComputedStyle(element);
    return { opacity: css.opacity, transform: css.transform };
  };
  const css = getComputedStyle(panel);
  const from = { clipPath: css.clipPath, backgroundColor: css.backgroundColor, opacity: css.opacity };
  const itemFrames = items.map(snapshot);
  const iconFrame = snapshot(icon);
  [panel, icon, arrow, ...items].forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
  trigger.setAttribute('aria-expanded', String(open));
  root.dataset.open = String(open);
  panel.inert = !open;
  trigger.hidden = open;
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate) {
    panel.hidden = !open;
    if (focus) (open ? close : trigger).focus({ preventScroll: true });
    return;
  }
  // Both elements share the same top edge. Measure the CTA before hiding it.
  trigger.hidden = false;
  const buttonHeight = trigger.getBoundingClientRect().height;
  const buttonColor = getComputedStyle(trigger).backgroundColor;
  trigger.hidden = open;
  panel.hidden = false;
  const collapsed = `inset(0px 0px ${Math.max(0, panel.getBoundingClientRect().height - buttonHeight)}px 0px round 12px)`;
  const expanded = 'inset(0px 0px 0px 0px round 12px)';
  const easing = 'cubic-bezier(.22, 1, .36, 1)';
  const shell = panel.animate([
    wasHidden ? { clipPath: collapsed, backgroundColor: buttonColor, opacity: 1 }
      : { ...from, clipPath: from.clipPath === 'none' ? expanded : from.clipPath },
    { clipPath: open ? expanded : collapsed, backgroundColor: open ? '#fff' : buttonColor, opacity: open ? 1 : 0 },
  ], { duration: open ? 500 : 320, easing, fill: 'both' });
  const content = items.map((item, index) => item.animate([
    wasHidden ? { opacity: 0, transform: 'translateY(12px)' } : itemFrames[index],
    { opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-8px)' },
  ], { duration: open ? 320 : 160, delay: open && wasHidden ? 100 + index * 45 : 0, easing, fill: 'both' }));
  const iconAnimation = icon.animate([
    wasHidden ? { opacity: 0, transform: 'rotate(-90deg) scale(.5)' } : iconFrame,
    { opacity: open ? 1 : 0, transform: open ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(.5)' },
  ], { duration: open ? 400 : 240, easing, fill: 'both' });
  const effects = [shell, ...content, iconAnimation];
  if (!open) effects.push(arrow.animate([
    { opacity: 0, transform: 'translate(-8px, 8px) scale(.9)' },
    { opacity: 1, transform: 'translate(0, 0) scale(1)' },
  ], { duration: 320, delay: 100, easing, fill: 'both' }));
  if (focus) (open ? close : trigger).focus({ preventScroll: true });
  shell.finished.then(() => {
    if (root.dataset.open === 'false') panel.hidden = true;
  }).catch(() => {});
  Promise.all(effects.map(animation => animation.finished)).then(() => {
    effects.forEach(animation => animation.cancel());
  }).catch(() => {});
}
