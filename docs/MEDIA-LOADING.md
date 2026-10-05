# Media loading states

Wrap ResponsiveImage in MediaLoading, passing the asset width and height. After mounting the markup, call initMediaLoading(scope, scrollRoot); call its returned disposer before replacing/removing that content or navigating away. Curated Shots owns this lifecycle in curated-shots.ts. The component and controller have no Shot-specific selectors and can be reused by Curated Projects.

The wrapper reserves the supplied intrinsic aspect ratio for loading, loaded artwork and fallback/error states. Missing dimensions use a stable 4:3 container with contain fitting; supply metadata for the exact artwork ratio. Images/GIFs are covered; video players and embeds keep their existing playback behavior.

The first image inside an opened Shot template is already eager/high priority. Other images retain native lazy loading. The controller begins a 100ms delay for eager images or when lazy containers intersect the scroll root; it does not preload offscreen content. Fast/cached images appear without a fade. Slower images decode before a 200ms crossfade, with a 1.6s dark shimmer during loading. Reduced motion disables shimmer and transitions.

Responsive-image recovery remains derivative -> original -> local fallback. If the fallback also fails, the shimmer stops and an accessible Image unavailable message appears. Closing, related-shot navigation, and Astro page swaps cancel listeners, timers, observers and stale decode completion effects. Existing dialog entrance/exit animations remain owned by CuratedShotOverlay.

Validation: node --test tests/media-loading.test.mjs tests/curated-shots.test.mjs tests/image-delivery.test.mjs. Local browser verification used a temporary six-second image endpoint with the real Shot overlay: 992x558 before/after loading, 374x210.375 at a 390px viewport, 200ms computed fade, high/eager first image, lazy subsequent image, and focus/scroll cleanup on dismissal. The temporary routes were removed. Reduced-motion CSS was checked in source; OS reduced-motion emulation was not run.
