# 8 September 2026 handoff implementation

Implemented locally in the existing Astro site. This supersedes the 7 September source audit. No deployment or launch-readiness sign-off is included.

## Source and scope

Read the current `07 - Behaviour & Handoff Notes` page (`5033:133`) in Figma file `FXrcGSbJF7X4lbbGanlb6d`, the current responsive frames, and owning component states. The supplied JPEGs are 2× references; implementation dimensions are CSS pixels. Figma documentation was used as product specifications, not as authorization to publish the site.

| CSS width | Home | Legal | 404 |
| --- | --- | --- | --- |
| 1440 | 5303:3403 | 5314:11138 | 5314:11317 |
| 1024 | 5314:6850 | 5314:11501 | 5314:11898 |
| 768 | 5314:7010 | 5314:11590 | 5314:11983 |
| 480 | 5314:8120 | 5314:12260 | 5314:12540 |
| 320 | 5314:8280 | 5314:12349 | 5314:12625 |

Only Home, `/legal/` and custom 404 are implemented. The layout stops growing at 1440px. Wider viewports center that composition. Work, project pages, shots, NDA and testimonials remain deferred.

## Changes

- Authored lengths use px. Reduced heading sizes, 48px primary buttons, placed header spacing, responsive section composition and footer typography follow the current source. The transparent header retains a persistent Burger/Close control in exactly the same position. The white menu is bounded to the viewport and scrolls internally when necessary.
- Logo hover changes both surface and mark. Stack hover changes both badge surface and artwork. White cards use dark social artwork; Footer Info uses light artwork and its own order.
- Rebuilt Process markup/controller with one active phase, a full-card semantic button, responsive illustration sources and interruptible size transitions. Exported all 25 current phase/layout illustrations and the separate desktop Develop/Prototype marker.
- Experience now keeps exactly one card open. Content can grow naturally; card dimensions are not fixed to Figma text examples.
- Contact replaces the CTA with a white card in the same slot, focuses Close, and restores the CTA and its focus when dismissed. No modal focus trap or page scroll lock is added.
- Added a shared black full-page loader with only the standalone light mark. It waits for document load, exits upward as one group, dismisses immediately for reduced motion, and releases the page after at most five seconds if a critical resource hangs. Baseline no-JS HTML has no blocking overlay.
- Hero uses the current Large/Small geometry. Re-read endpoints: Large lower layer y=211.6916→367.6916, Small y=149.0457→273.0457. The reversible scroll range remains measured CSS 100vh.
- Exported the already-oriented Figma waves fallback. Static and live paths are mutually exclusive. A valid WebGL frame enables the live layer; initialization/drawing/context failure leaves or restores the fallback. Reduced motion uses the static artwork.
- Replaced the separate certificate layers with the supplied `All-awards.png`; removed the four obsolete production certificate files. Corrected portrait cropping, Stack order and narrow award layout.
- Restored the responsive 404 illustration from current Figma nodes; the supplied 1024 artwork remains in use. Mobile headings and recovery button follow the narrow layout.
- Removed the unrequested Legal contents navigation and extra article-end CTA. Recovered semantic lists from Figma text metadata. Wording and the fixed 31 August 2026 date are unchanged. Policy web links open new tabs with `noopener noreferrer`; mailto stays native.
- Verified the stable Astro version through the package registry and pinned the compatible 7.3.2 patch with the lockfile. Installation audit reported no vulnerabilities.

## Validation

`npm run check`, production build and all seven DOM/interaction tests pass. All three static routes generate. Browser scripts are retained in `scripts/verify-browser.mjs` and `scripts/verify-failures.mjs` (plus `scripts/verify-edge-cases.mjs`) and use an external Playwright installation, without adding it to the shipped site.

The Chrome matrix covers Home, Legal and 404 at 320, 375, 480, 600, 768, 900, 1024, 1200, 1440 and 1920 viewport pixels. Checks include horizontal overflow, image loading, console errors, same-position menu toggling, contact replacement/focus, every Process phase and single-open Experience. Five reference-width screenshots per route were captured in `/private/tmp/handoff-qa/`. These use reduced motion, so the stationary marquee wraps intentionally and differs from the moving JPEG reference.

Failure checks cover no-JS content, a hung critical font resource and the five-second loader timeout, valid-frame renderer readiness, WebGL context loss, initialization failure, reversible hero endpoint movement, and rapid menu/phase changes. Additional checks passed for a 320×320 touch viewport, full-card tap/Space selection and resize persistence, deep unknown-route HTTP 404, policy links/lists, the persisted-pageshow cleanup handler and missing-transitionend completion. Machine-readable results are recorded beside this document under `qa/`.

Visual inspection included full-page Home and 404 captures plus open menu/contact states. This is not a pixel-difference certification of every frame or a complete accessibility audit. Flexible text content, intermediate widths and browser font metrics can produce different section heights from fixed Figma examples.

## Remaining release checks

- Final owner visual review, real touch devices, 200% browser zoom, Safari/VoiceOver and NVDA. A short touch viewport was emulated in Chrome; that does not replace device acceptance. Actual Back/Forward cache and OS mail-handler behavior need real-browser acceptance beyond the implemented event handling/native links.
- Approved sharing artwork is still absent; OG/Twitter image metadata awaits that asset. Final CV content/PDF accessibility and external-profile reachability need owner/manual review.
- Cloudflare/domain/HTTPS/redirects, deployed 404 status, analytics configuration and policy/service alignment remain launch checks. This implementation does not publish or configure those services.
- The specified continuously moving marquee still has no pause/stop/hide control. Reduced-motion support alone does not establish WCAG SC 2.2.2 conformance. Review live waves alongside that recorded limitation.
