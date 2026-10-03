/** One delegated listener also covers images mounted later from modal templates. */
export function initResponsiveImages() {
  const root = document.documentElement;
  if (root.dataset.responsiveImagesInitialized) return;
  root.dataset.responsiveImagesInitialized = 'true';
  const controller = new AbortController();
  const recover = (image: HTMLImageElement) => {
    if (!image.hasAttribute('data-responsive-image')) return;
    const original = image.dataset.imageOriginal;
    const fallback = image.dataset.responsiveImageFallback;
    const current = image.getAttribute('src');
    const stage = Number(image.dataset.imageRecoveryStage || 0);
    // Track attempts rather than URL comparisons: the browser normalizes absolute URLs.
    const next = stage === 0 && original && (image.hasAttribute('srcset') || current !== original) ? original : stage < 2 ? fallback : undefined;
    image.dataset.imageRecoveryStage = next === original ? '1' : '2';
    if (!next || (current === next && !image.hasAttribute('srcset'))) return;
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = next;
  };
  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) recover(event.target);
  }, { capture: true, signal: controller.signal });
  document.querySelectorAll<HTMLImageElement>('img[data-responsive-image]').forEach(image => {
    if (image.complete && !image.naturalWidth) recover(image);
  });
  // A video's poster failure does not emit an image error on the video element.
  // Probe mounted posters through the browser cache; templates stay inert until opened.
  const watchedPosters = new WeakSet<HTMLVideoElement>();
  const watchPosters = (scope: ParentNode) => {
    const videos = [...scope.querySelectorAll<HTMLVideoElement>('video[data-responsive-poster]')];
    if (scope instanceof HTMLVideoElement && scope.matches('[data-responsive-poster]')) videos.push(scope);
    for (const video of videos) {
      if (watchedPosters.has(video)) continue;
      watchedPosters.add(video);
      const candidates = [...new Set([video.poster, video.dataset.posterOriginal, video.dataset.posterFallback].filter(Boolean))] as string[];
      let index = 0;
      const probe = new Image();
      probe.addEventListener('error', () => {
        if (!video.isConnected || ++index >= candidates.length) return;
        video.poster = candidates[index];
        probe.src = candidates[index];
      }, { signal: controller.signal });
      if (candidates[0]) probe.src = candidates[0];
    }
  };
  watchPosters(document);
  const posters = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node instanceof Element) watchPosters(node);
    }
  });
  posters.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('astro:before-swap', () => {
    posters.disconnect();
    controller.abort();
    delete root.dataset.responsiveImagesInitialized;
  }, { once: true, signal: controller.signal });
}
