/** One native dialog, with only the active shot mounted. Closed shots never play. */
export function initCuratedShots() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-shot-dialog]');
  if (!dialog || dialog.dataset.initialized) return;
  dialog.dataset.initialized = 'true';
  const content = dialog.querySelector<HTMLElement>('[data-shot-content]')!;
  const scrollContainer = dialog.querySelector<HTMLElement>('[data-shot-scroll]')!;
  const controller = new AbortController();
  const { signal } = controller;
  let opener: HTMLElement | null = null;
  let overflow = '';
  let bodyOverflow = '';
  let observer: IntersectionObserver | undefined;
  let closeSequence = 0;

  const requestClose = () => {
    if (!dialog.open || dialog.dataset.motion === 'closing') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !dialog.getAnimations) {
      dialog.close();
      return;
    }
    // Sample the entrance frame so an early dismissal continues without a jump.
    const current = document.defaultView!.getComputedStyle(dialog);
    dialog.style.setProperty('--shot-exit-opacity', current.opacity);
    dialog.style.setProperty('--shot-exit-transform', current.transform);
    dialog.dataset.motion = 'closing';
    const sequence = ++closeSequence;
    observer?.disconnect();
    content.querySelectorAll('video').forEach(video => video.pause());
    // Keep the native top layer, backdrop, content and focus until motion finishes.
    const animations = dialog.getAnimations();
    if (!animations.length) {
      dialog.close();
      return;
    }
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (!signal.aborted && sequence === closeSequence && dialog.open && dialog.dataset.motion === 'closing') dialog.close();
    });
  };

  const stopMedia = () => {
    observer?.disconnect();
    content.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
    content.querySelectorAll('iframe').forEach(frame => frame.removeAttribute('src'));
  };
  const fixImage = (image: HTMLImageElement) => {
    const fallback = image.dataset.imageFallback;
    if (fallback && image.getAttribute('src') !== fallback) {
      image.removeAttribute('srcset');
      image.src = fallback;
    }
  };
  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) fixImage(event.target);
    if (event.target instanceof HTMLVideoElement && event.target.matches('[data-shot-video]')) {
      event.target.hidden = true;
      const fallback = event.target.parentElement?.querySelector<HTMLElement>('[data-video-fallback]');
      if (fallback) fallback.hidden = false;
    }
  }, { capture: true, signal });
  document.querySelectorAll<HTMLImageElement>('[data-image-fallback]').forEach(image => {
    if (image.complete && !image.naturalWidth) fixImage(image);
  });

  const startMedia = () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const activate = (element: HTMLVideoElement | HTMLIFrameElement) => {
      if (!dialog.open || dialog.dataset.motion === 'closing' || !element.isConnected) return;
      if (element instanceof HTMLVideoElement) {
        if (!element.getAttribute('src')) element.src = element.dataset.src!;
        element.muted = true;
        if (!reduced) void element.play().catch(() => { /* Native controls remain available. */ });
      } else if (!element.getAttribute('src')) {
        const url = new URL(element.dataset.src!);
        if (reduced) url.searchParams.set('autoplay', '0');
        element.src = url.href;
      }
    };
    // Autoplay only as media enters the modal viewport, avoiding concurrent offscreen playback.
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const element = entry.target as HTMLVideoElement | HTMLIFrameElement;
      if (entry.isIntersecting) activate(element);
      else if (element instanceof HTMLVideoElement) element.pause();
      else element.removeAttribute('src');
    }), { root: scrollContainer, threshold: 0.05 });
    content.querySelectorAll<HTMLVideoElement | HTMLIFrameElement>('[data-shot-video],[data-shot-embed]').forEach(element => observer!.observe(element));
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-shot-open]') : null;
    if (!target || dialog.dataset.motion === 'closing') return;
    const template = [...document.querySelectorAll<HTMLTemplateElement>('[data-shot-template]')].find(item => item.dataset.shotTemplate === target.dataset.shotOpen);
    if (!template) return;
    if (!dialog.open) {
      opener = target;
      overflow = document.documentElement.style.overflow;
      bodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    stopMedia();
    content.replaceChildren(template.content.cloneNode(true));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    scrollContainer.scrollTop = 0;
    content.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    startMedia();
  }, { signal });
  dialog.querySelector('[data-shot-close]')!.addEventListener('click', requestClose, { signal });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    requestClose();
  }, { signal });
  let backdropDown = false;
  const outside = (event: PointerEvent | MouseEvent) => {
    // Native backdrop events target the dialog; its transparent gap and bar are also background.
    return event.target === dialog || (event.target instanceof Element && event.target.matches('.shot-close-bar'));
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = outside(event); }, { signal });
  dialog.addEventListener('click', event => {
    if (backdropDown && outside(event)) requestClose();
    backdropDown = false;
  }, { signal });
  const cleanup = () => {
    closeSequence++;
    delete dialog.dataset.motion;
    dialog.style.removeProperty('--shot-exit-opacity');
    dialog.style.removeProperty('--shot-exit-transform');
    backdropDown = false;
    stopMedia();
    content.replaceChildren();
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = bodyOverflow;
    opener?.focus({ preventScroll: true });
    opener = null;
  };
  dialog.addEventListener('close', () => {
    if (!dialog.open) cleanup();
  }, { signal });
  document.addEventListener('astro:before-swap', () => {
    if (dialog.open) {
      dialog.close();
      // The native close event is queued; restore scrolling before aborting its listener.
      cleanup();
    } else stopMedia();
    controller.abort();
  }, { once: true, signal });
}
