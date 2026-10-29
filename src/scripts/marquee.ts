/** Figma Marquee — 5723:2208. Reveal interaction after the Codrops MarqueeMenu demo. */
export type Edge = 'top' | 'bottom';
export interface MarqueeThumbnail { src: string; srcset?: string; sizes?: string; original: string; }

const DURATION = 600;
// GSAP expo (out), as used by the Codrops demo.
const EXPO_OUT = 'cubic-bezier(.16,1,.3,1)';
const HIDDEN = 101;

/** Comparing distances to the top-centre and bottom-centre points reduces to the half height. */
export const closestEdge = (y: number, height: number): Edge => y < height / 2 ? 'top' : 'bottom';

/** Fisher–Yates over a copy; `random` returns values in [0, 1). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** One thumbnail per line, distinct while the pool lasts, then repeated in the shuffled order. */
export function pickThumbnails<T>(lines: number, pool: readonly T[], random: () => number = Math.random): T[] {
  if (!pool.length || lines <= 0) return [];
  const order = shuffle(pool, random);
  // Cycling a pool of two or more never places the same entry on neighbouring lines.
  return Array.from({ length: lines }, (_, i) => order[i % order.length]);
}

/** Matches the CSS `view()` cover range: 0 as the line enters below, 1 as it leaves above. */
export function viewProgress(top: number, height: number, viewport: number): number {
  const range = viewport + height;
  if (!(range > 0)) return 0;
  return Math.min(1, Math.max(0, (viewport - top) / range));
}

/** translateX percentage for the touch drift; odd lines move left to right, even lines reverse. */
export const driftOffset = (progress: number, reverse: boolean): number =>
  reverse ? -15 - 20 * progress : -35 + 20 * progress;

function parsePool(value?: string): MarqueeThumbnail[] {
  try {
    const pool: unknown = JSON.parse(value || '[]');
    return Array.isArray(pool) ? pool.filter((item): item is MarqueeThumbnail => typeof item?.src === 'string' && typeof item?.original === 'string') : [];
  } catch { return []; }
}

function loadThumbnail(image: HTMLImageElement, thumbnail: MarqueeThumbnail) {
  let retried = false;
  image.addEventListener('load', () => { image.dataset.loaded = 'true'; });
  image.addEventListener('error', () => {
    // Retry the untransformed original once; afterwards the grey Pill remains.
    if (retried) return;
    retried = true;
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = thumbnail.original;
  });
  if (thumbnail.sizes) image.setAttribute('sizes', thumbnail.sizes);
  if (thumbnail.srcset) image.setAttribute('srcset', thumbnail.srcset);
  image.src = thumbnail.src;
}

export function initMarquee(root: HTMLElement) {
  if (root.dataset.ready) return;
  const lines = [...root.querySelectorAll<HTMLElement>('.marquee-line')];
  const hover = matchMedia('(hover: hover)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  lines.forEach(line => {
    const overlay = line.querySelector<HTMLElement>('.marquee-overlay');
    const inner = line.querySelector<HTMLElement>('.marquee-overlay-inner');
    if (!overlay || !inner) return;
    let visit = 0;
    const move = (element: HTMLElement, to: number, from?: number) => {
      // Start from the rendered position so an interrupted reveal continues without a jump.
      const start = from === undefined ? getComputedStyle(element).transform : `translateY(${from}%)`;
      element.getAnimations().forEach(animation => animation.cancel());
      element.style.transform = `translateY(${to}%)`;
      if (reduced.matches) return undefined;
      return element.animate([{ transform: start }, { transform: `translateY(${to}%)` }], { duration: DURATION, easing: EXPO_OUT });
    };
    line.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !hover.matches) return;
      visit++;
      const rect = line.getBoundingClientRect();
      const offset = closestEdge(event.clientY - rect.top, rect.height) === 'top' ? -HIDDEN : HIDDEN;
      line.dataset.active = 'true';
      move(overlay, 0, offset);
      move(inner, 0, -offset);
    });
    line.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch' || !line.dataset.active) return;
      const current = visit;
      const rect = line.getBoundingClientRect();
      const offset = closestEdge(event.clientY - rect.top, rect.height) === 'top' ? -HIDDEN : HIDDEN;
      const exit = move(overlay, offset);
      move(inner, -offset);
      // Keep the loop running through the exit, then pause it while the line is hidden.
      const pause = () => { if (current === visit) delete line.dataset.active; };
      if (exit) exit.finished.then(pause, () => {}); else pause();
    });
  });

  const pool = parsePool(root.dataset.marqueePool);
  let observer: IntersectionObserver | undefined;
  let loaded = false;
  const load = () => {
    if (loaded || observer || !hover.matches) return;
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer?.disconnect();
      loaded = true;
      pickThumbnails(lines.length, pool).forEach((thumbnail, i) => {
        lines[i].querySelectorAll<HTMLImageElement>('.marquee-pill img').forEach(image => loadThumbnail(image, thumbnail));
      });
    }, { rootMargin: '200px 0px' });
    observer.observe(root);
  };
  load();
  hover.addEventListener?.('change', load);

  // Browsers without scroll-driven animations drive the same touch drift from scroll.
  if (!CSS.supports('animation-timeline: view()')) {
    const tracks = lines.map(line => line.querySelector<HTMLElement>('.marquee-default'));
    let frame = 0;
    const update = () => {
      frame = 0;
      // Measure the track itself, the same subject as the CSS view() timeline.
      tracks.forEach((track, i) => {
        if (!track) return;
        const rect = track.getBoundingClientRect();
        track.style.transform = `translateX(${driftOffset(viewProgress(rect.top, rect.height, innerHeight), i % 2 === 1)}%)`;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const touch = matchMedia('(hover: none)');
    let active = false;
    const sync = () => {
      const next = touch.matches && !reduced.matches;
      if (next === active) return;
      active = next;
      if (active) {
        addEventListener('scroll', schedule, { passive: true });
        addEventListener('resize', schedule, { passive: true });
        update();
      } else {
        removeEventListener('scroll', schedule);
        removeEventListener('resize', schedule);
        cancelAnimationFrame(frame);
        frame = 0;
        tracks.forEach(track => track?.style.removeProperty('transform'));
      }
    };
    sync();
    touch.addEventListener?.('change', sync);
    reduced.addEventListener?.('change', sync);
  }
  root.dataset.ready = 'true';
}
