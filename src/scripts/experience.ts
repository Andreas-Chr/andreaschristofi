import { cssTimeToMilliseconds } from './css-time.ts';

import { setPanel } from './disclosure.ts';

const transitions = new WeakMap<HTMLElement, Animation>();

/** Animate the panel's space and content together, including interrupted selections. */
export function setExperiencePanel(panel: HTMLElement, trigger: HTMLButtonElement, open: boolean, animate = true) {
  if (animate && trigger.getAttribute('aria-expanded') === String(open)) return;

  const visible = !panel.hidden;
  const css = getComputedStyle(panel);
  const from = {
    height: `${visible ? panel.getBoundingClientRect().height : 0}px`,
    marginTop: visible ? css.marginTop : '0px',
    opacity: visible ? css.opacity : '0',
    transform: visible ? css.transform : 'translateY(-8px)',
  };
  transitions.get(panel)?.cancel();
  transitions.delete(panel);
  // Update focus, aria-expanded and inert immediately; visibility follows the motion.
  setPanel(panel, trigger, open, false);
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate || (!open && !visible)) return;

  panel.hidden = false;
  const target = {
    height: `${open ? panel.getBoundingClientRect().height : 0}px`,
    marginTop: open ? getComputedStyle(panel).marginTop : '0px',
    opacity: open ? '1' : '0',
    transform: open ? 'translateY(0)' : 'translateY(-8px)',
  };
  const animation = panel.animate([
    { ...from, overflow: 'hidden' },
    { ...target, overflow: 'hidden' },
  ], {
    duration: cssTimeToMilliseconds(css.getPropertyValue('--primitive-animation-duration-standard')),
    easing: css.getPropertyValue('--primitive-animation-easing-standard').trim() || 'ease-out',
    fill: 'both',
  });
  transitions.set(panel, animation);
  animation.finished.then(() => {
    if (transitions.get(panel) !== animation) return;
    panel.hidden = !open;
    animation.cancel();
    transitions.delete(panel);
  }).catch(() => {});
}
