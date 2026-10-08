import { initMediaLoading } from './media-loading.ts';

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
  let disposeMediaLoading: (() => void) | undefined;
  let disposeMotionPreference: (() => void) | undefined;
  let closeSequence = 0;
  let pointerInput = false;
  let pointerFocusedCard: HTMLElement | null = null;
  const clearPointerFocus = () => {
    pointerFocusedCard?.removeAttribute('data-shot-pointer-focus');
    pointerFocusedCard = null;
  };
  document.addEventListener('pointerdown', () => { pointerInput = true; }, { capture: true, signal });
  document.addEventListener('keydown', () => {
    pointerInput = false;
    clearPointerFocus();
  }, { capture: true, signal });
  document.addEventListener('focusout', event => {
    if (event.target === pointerFocusedCard) clearPointerFocus();
  }, { signal });

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
    disposeMotionPreference?.();
    disposeMotionPreference = undefined;
    disposeMediaLoading?.();
    disposeMediaLoading = undefined;
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
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const playerURL = (element: HTMLIFrameElement) => {
      const url = new URL(element.dataset.src!);
      if (motionPreference.matches) {
        url.searchParams.set('autoplay', '0');
        if (url.hostname === 'player.vimeo.com') {
          url.searchParams.set('background', '0');
          url.searchParams.set('controls', '1');
        }
      }
      return url.href;
    };
    const activate = (element: HTMLVideoElement | HTMLIFrameElement) => {
      if (!dialog.open || dialog.dataset.motion === 'closing' || !element.isConnected) return;
      if (element instanceof HTMLVideoElement) {
        if (!element.getAttribute('src')) element.src = element.dataset.src!;
        element.muted = true;
        if (!motionPreference.matches) void element.play().catch(() => { /* Native controls remain available. */ });
      } else if (!element.getAttribute('src')) {
        element.src = playerURL(element);
      }
    };
    // Load only in the modal viewport. Vimeo owns playback settings except under reduced motion.
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const element = entry.target as HTMLVideoElement | HTMLIFrameElement;
      if (entry.isIntersecting) activate(element);
      else if (element instanceof HTMLVideoElement) element.pause();
      else element.removeAttribute('src');
    }), { root: scrollContainer, threshold: 0.05 });
    content.querySelectorAll<HTMLVideoElement | HTMLIFrameElement>('[data-shot-video],[data-shot-embed]').forEach(element => observer!.observe(element));
    const reducePlayback = () => {
      // Enabling reduced motion takes effect now; disabling it must not restart media.
      if (!motionPreference.matches || !dialog.open) return;
      if (dialog.dataset.motion === 'closing') {
        dialog.close();
        return;
      }
      content.querySelectorAll<HTMLVideoElement>('[data-shot-video]').forEach(video => video.pause());
      // Only reload mounted players that already have a source, keeping offscreen embeds inert.
      content.querySelectorAll<HTMLIFrameElement>('[data-shot-embed][src]').forEach(frame => {
        const source = playerURL(frame);
        if (frame.getAttribute('src') !== source) frame.src = source;
      });
    };
    motionPreference.addEventListener?.('change', reducePlayback);
    disposeMotionPreference = () => motionPreference.removeEventListener?.('change', reducePlayback);
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
    disposeMediaLoading = initMediaLoading(content, scrollContainer);
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
    // A dialog's focused heading can make restored touch focus match :focus-visible.
    // Keep the focus return, but let touch cards display their default appearance.
    clearPointerFocus();
    if (pointerInput && opener) {
      pointerFocusedCard = opener;
      opener.setAttribute('data-shot-pointer-focus', '');
    }
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
    clearPointerFocus();
    controller.abort();
  }, { once: true, signal });
}
