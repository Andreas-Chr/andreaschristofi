/** Plays the decorative hero loop only while it is on screen and motion is allowed; the poster stands in otherwise. */
export function initHeroVideo(root: HTMLElement) {
  const video = root.querySelector<HTMLVideoElement>('video');
  if (!video || root.dataset.videoInitialized) return;
  root.dataset.videoInitialized = 'true';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  const sync = () => {
    if (preference.matches || !visible) video.pause();
    // Autoplay can still be refused (e.g. power saving); the poster remains.
    else video.play()?.catch(() => {});
  };
  preference.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(root);
  }
  sync();
}
