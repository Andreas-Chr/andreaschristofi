/** Track the visible region without intercepting its links or touch scrolling. */
export function bindWavePointer(region, canvas, target, flipped=false) {
  const reset = () => { target[0] = target[1] = 0.5; };
  const move = event => {
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const clamp = value => Math.max(0, Math.min(1, value));
    target[0] = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    target[1] = flipped ? y : 1 - y;
  };
  region.addEventListener('pointermove', move, { passive: true });
  region.addEventListener('pointerleave', reset);
  region.addEventListener('pointercancel', reset);
  return () => {
    region.removeEventListener('pointermove', move);
    region.removeEventListener('pointerleave', reset);
    region.removeEventListener('pointercancel', reset);
  };
}
