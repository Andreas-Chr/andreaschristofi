/** Call before changing data-open so interrupted motion starts at its visible position. */
export function animateMenuIcon(trigger: HTMLButtonElement, open: boolean) {
  const lines = [...trigger.querySelectorAll<HTMLElement>('.menu-icon-line')];
  const from = lines.map(line => {
    const css = getComputedStyle(line);
    return { transform: css.transform, clipPath: css.clipPath };
  });
  lines.forEach(line => line.getAnimations().forEach(animation => animation.cancel()));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lines.forEach((line, index) => {
    if (!line.animate) return;
    const flat = `translateY(${index === 0 ? -2.875 : 2.875}px) rotate(0deg)`;
    const diagonal = `translateY(0px) rotate(${index === 0 ? 45 : -45}deg)`;
    const full = 'inset(0% 0% 0% 0%)';
    const retracted = index === 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
    const easing = 'cubic-bezier(.4, 0, .2, 1)';
    // Retract toward opposite ends; redraw each diagonal from its upper tip.
    // No delayed animation starts: a rapid reversal samples the current frame.
    line.animate(open ? [
      { ...from[index], offset: 0, easing },
      { transform: from[index].transform, clipPath: retracted, offset: index === 0 ? .24 : .32 },
      { transform: diagonal, clipPath: retracted, offset: index === 0 ? .25 : .33 },
      { transform: diagonal, clipPath: retracted, offset: index === 0 ? .26 : .55, easing },
      { transform: diagonal, clipPath: full, offset: 1 },
    ] : [
      { ...from[index], offset: 0, easing },
      { transform: 'translateY(0px) rotate(0deg)', clipPath: full, offset: .65, easing },
      { transform: flat, clipPath: full, offset: 1 },
    ], { duration: open ? 760 : 360 });
  });
}
