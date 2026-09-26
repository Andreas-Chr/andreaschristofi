# Local and production comparison — 2026-09-26

Compared the running development server at `http://127.0.0.1:4321`, a fresh production build, and `https://andreaschristofi.com`. The corrected production preview is available at `http://127.0.0.1:4322` while its server is running. Changes are local; production has not been updated.

## Confirmed differences and fixes

Astro loads component styles in a different order during development and in production CSS chunks. The shared `.button-accordion` reset was emitted after the homepage overrides with equal specificity.

| Area | Production behavior before fix | Local change |
| --- | --- | --- |
| Experience | `display:inline-flex` overrode `display:block`, placing the employer and role/date beside each other | Scoped the override under `.experience` so it wins in either order |
| Process | The shared `font:inherit` reset overrode the section's heading font | Scoped the override under `.process` to preserve 900-weight, 24px/36px primary typography |

## Comparison evidence

- Before edits, Home, Legal, Design System and 404 HTML matched production after normalizing Astro's generated island `uid` attribute.
- Local `.env` and deployment documentation both use `https://cms.andreaschristofi.com`.
- All 126 referenced same-origin assets returned HTTP 200. Of those, 118 were byte-identical, including referenced CSS, JavaScript, fonts, SVGs and the CV.
- Eight responsive AVIF files differed in bytes and decoded pixels. Their dimensions match. Mean absolute RGBA channel differences range from 0.62 to 2.02 on the 0–255 scale. This is consistent with encoding differences; the precise cause was not established. No image assets were changed.

## Validation

- Production build passed using current public CMS content.
- Astro check: 44 files, zero errors, warnings or hints.
- Seven focused menu, contact, hero-motion, Process and Experience behavior checks passed.
- DOM/CSS checks confirmed the corrected Experience display and Process font properties at 390, 768 and 1440px, in development and production output, with stylesheet order both normal and reversed. These are Happy DOM checks, not browser visual sign-off.
- The baseline full suite had 15 passes and seven failures. Four Curated Shots interaction tests assume a modal exists; two homepage/anchor checks assume published shots exist. Production and local output currently contain no shots. One button test rejects the contact popup's intentional `type="submit"` close control inside a `method="dialog"` form. These existing failures were not changed or suppressed.

## Outstanding findings and limits

- The visible “Curated Works” button points to an absent `#curated-shots` when the CMS has no published shots. Both environments share this empty-content issue. It needs an explicit empty-state treatment (for example, hiding the action until work is available).
- The Process section references `process-heading` through `aria-labelledby`, but the heading is absent in current markup. This is shared by both environments.
- Browser screenshots confirmed the deployed accordion presentation, but subsequent screenshot captures did not reliably correspond to the tab reported by browser accessibility state. A complete matching-viewport visual and interaction comparison, including mobile, remains unverified.
- Deployment is still required for the two local CSS fixes to appear on the public site.

For production-style local review, use `npm run build` followed by `npm run preview`. `npm run dev` includes Astro's development toolbar and development asset delivery.
