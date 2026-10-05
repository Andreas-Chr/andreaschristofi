/** Mount after inserting media; dispose before removing it. Shared by any media gallery. */
export function initMediaLoading(scope: ParentNode, root: HTMLElement): () => void {
  const controller = new AbortController();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cancel = (timer: ReturnType<typeof setTimeout> | undefined) => {
    if (timer !== undefined) { clearTimeout(timer); timers.delete(timer); }
  };
  const starts = new Map<Element, () => void>();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      starts.get(entry.target)?.();
      observer.unobserve(entry.target);
    }
  }, { root });
  scope.querySelectorAll<HTMLElement>('[data-media-loading]').forEach(container => {
    const image = container.querySelector('img');
    if (!image) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    let settled = false;
    let decoding = false;
    container.dataset.mediaState = 'pending';
    const finish = (failed = false) => {
      if (controller.signal.aborted || settled) return;
      settled = true;
      cancel(timer);
      const shimmerVisible = container.dataset.mediaState === 'loading';
      container.dataset.mediaState = failed ? 'error' : shimmerVisible ? 'revealed' : 'ready';
      container.removeAttribute('aria-busy');
      const error = container.querySelector<HTMLElement>('.media-error');
      if (error) error.hidden = !failed;
      observer.unobserve(container);
    };
    const ready = async () => {
      if (!image.complete || !image.naturalWidth || decoding || settled) return;
      decoding = true;
      const source = image.currentSrc || image.src;
      try { await image.decode(); } catch { /* A loaded GIF or browser decode failure may still render. */ }
      decoding = false;
      if (controller.signal.aborted) return;
      if (source !== (image.currentSrc || image.src)) { void ready(); return; }
      if (image.complete && image.naturalWidth) finish();
    };
    const start = () => {
      if (started || settled) return;
      started = true;
      container.setAttribute('aria-busy', 'true');
      timer = setTimeout(() => {
        timers.delete(timer!);
        if (!settled) container.dataset.mediaState = 'loading';
      }, 100);
      timers.add(timer);
      void ready();
    };
    image.addEventListener('load', () => { void ready(); }, { signal:controller.signal });
    image.addEventListener('error', () => {
      // The existing document capture listener first advances derivative -> original -> fallback.
      // Only terminate after the fallback itself fails, never while recovery is in flight.
      queueMicrotask(() => {
        if (image.complete && !image.naturalWidth &&
            (!image.hasAttribute('data-responsive-image') || image.dataset.imageRecoveryStage === '2')) finish(true);
      });
    }, { signal:controller.signal });
    starts.set(container, start);
    if (image.loading === 'eager') start();
    else { observer.observe(container); void ready(); }
  });
  return () => {
    controller.abort();
    observer.disconnect();
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
