/**
 * Fade in up for page elements marked [data-reveal] (styles in reveal.css). Each element rises into place the first
 * time it scrolls into view, and elements entering together cascade. The first screen waits for the page loader so it
 * animates as it is uncovered. Only elements this script picks up are hidden: without JavaScript, or with reduced
 * motion, everything simply shows.
 */
const STAGGER_MS = 60;
const MAX_STAGGER_STEPS = 8;
// An element starts once its top is this far up from the bottom of the viewport, well into view.
const TRIGGER_LINE = '20%';
let observer: IntersectionObserver | undefined;
const waiting = new Set<HTMLElement>();

const finish = (element: HTMLElement) => {
  observer?.unobserve(element);
  element.dataset.reveal = 'done';
  element.style.removeProperty('--reveal-delay');
};

const rise = (elements: { element: HTMLElement; rect: DOMRectReadOnly }[]) => {
  elements.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left).forEach(({ element }, index) => {
    observer?.unobserve(element);
    element.style.setProperty('--reveal-delay', `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
    element.dataset.reveal = 'shown';
  });
};

const enter = (entries: IntersectionObserverEntry[]) => {
  rise(entries.filter(entry => entry.isIntersecting).map(entry => ({ element: entry.target as HTMLElement, rect: entry.boundingClientRect })));
  // Content the page is already scrolled past (a restored scroll position) shows without animating.
  entries.forEach(entry => { if (!entry.isIntersecting && entry.boundingClientRect.bottom <= 0) finish(entry.target as HTMLElement); });
};

// The last elements on a page may never scroll up to the trigger line, so reaching the end reveals what is in view.
const revealAtEnd = () => {
  if (innerHeight + scrollY < document.documentElement.scrollHeight - 2) return;
  rise([...document.querySelectorAll<HTMLElement>("[data-reveal='pending']")]
    .map(element => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.top < innerHeight && rect.bottom > 0));
};

const start = () => {
  if (observer) return;
  observer = new IntersectionObserver(enter, { rootMargin: `0px 0px -${TRIGGER_LINE} 0px` });
  waiting.forEach(element => observer!.observe(element));
  waiting.clear();
  addEventListener('scroll', revealAtEnd, { passive: true });
  addEventListener('resize', revealAtEnd);
  revealAtEnd();
};

/** Hide the elements until they scroll into view, e.g. content inserted after load. */
export function observeReveal(elements: Iterable<HTMLElement>) {
  if (!matchMedia('(prefers-reduced-motion: no-preference)').matches || !('IntersectionObserver' in window)) return;
  for (const element of elements) {
    element.dataset.reveal = 'pending';
    if (observer) observer.observe(element);
    else waiting.add(element);
  }
}

document.addEventListener('animationend', event => {
  const element = event.target as HTMLElement;
  if (event.animationName === 'reveal-up' && element.dataset.reveal === 'shown') finish(element);
});
document.addEventListener('animationcancel', event => {
  const element = event.target as HTMLElement;
  if (event.animationName === 'reveal-up' && element.dataset.reveal === 'shown') finish(element);
});

observeReveal(document.querySelectorAll<HTMLElement>("[data-reveal='']"));
// The loader covers the page until it announces it is done; without a visible loader, start now.
const loader = document.querySelector<HTMLElement>('.page-loader');
if (!loader || loader.hidden || document.documentElement.dataset.pageLoader === 'done') start();
else document.addEventListener('page-loader:done', start, { once: true });
