# Shared CMS image delivery

Curated Shots uses the shared image layer for homepage/related thumbnails, responsive
detail images and native-video posters. The same layer can serve future Curated Projects.
No CMS schema, D1, R2 upload or preview setup change is required. Projects now share the CMS publication rebuild hooks; deploying that hook addition requires an app-only CMS release, with no migration.

## Contract

`normalizePayloadMedia(upload, cmsBase)` in `src/lib/media-assets.ts` preserves asset-owned
alt, URL, MIME type, uploaded dimensions, filesize and updated timestamp. Shot adapters
retain compatible legacy fields and add shared asset/poster metadata. Future Project
adapters can reuse the normalizer for thumbnails, heroes and galleries.

`getImageProps(asset, { preset, sizes, priority?, preserveResolution?, enabled? })` returns
native img attributes. Presets are card, content, hero, gallery and poster. Consumers
supply the actual layout sizes; the browser accounts for viewport and pixel density.
`ResponsiveImage.astro` accepts the same options plus a required safe fallback.

Loading is owned by `getImageProps`, independently of Cloudflare transformation eligibility.
Every default image emits `loading="lazy" decoding="async"`, including GIFs and
sources that pass through without transformation. Explicit `priority={true}` emits
`loading="eager" fetchpriority="high" decoding="async"`; it does not change URLs,
responsive candidates, sizes, dimensions or alt text. Use it intentionally for critical
visible artwork, never based on card index or the `hero` preset alone.

`CuratedShotCard` and `CuratedShotMedia` forward their optional `priority` prop to
`ResponsiveImage`. Homepage and related thumbnails use the lazy default. The first
modal artwork is explicitly prioritized because it is immediately visible after opening;
its template is inert until mounted. Remaining modal artwork is lazy, with the existing
`MediaLoading` skeleton/decode/fade lifecycle. Future Project heroes, thumbnails and
gallery images inherit the same lazy default when rendered with `ResponsiveImage`;
pass `priority={true}` only for a deliberately critical image on the future page.

## Current delivery policy

- Resize production CMS PNG/JPEG uploads only when valid dimensions are available.
- All eligible PNG/JPEG `src` and `srcset` URLs use
  `width=…,fit=scale-down,quality=90,format=auto`, including intrinsic-width candidates.
  Cloudflare negotiates output format; quality 90 still requires visual review.
- Card candidates: 320/480/640/800/1024, capped at 1024px.
- Content/overlay candidates: 480/640/800/1024/1200/1440/1600, capped at 1600px.
  Both presets stop at source width and include that exact width when below the cap.
- `preserveResolution` selects only the largest derivative allowed by the preset,
  still subject to source dimensions; it does not bypass transformation or the cap.
- Intrinsic dimensions and consumer-provided sizes remain unchanged. CSS owns cropping.
- GIF, SVG, video, existing WebP/AVIF, unknown metadata, other origins and local sources
  pass through. Native video sources, embeds and animation behavior are unchanged.
- First detail image: eager/high priority. Other images: lazy, async decoding.
- `updatedAt` revisions transformed sources and recovery originals. Revisioned original URLs remain available for recovery: derivative -> original -> placeholder.
  Public CMS originals keep their revision even when resizing is disabled, the type passes
  through, or dimensions are absent.
- `IMAGE_TRANSFORMATIONS_ENABLED=false` disables transformations at build time.
- localhost:8787 and 127.0.0.1 CMS URLs remain direct. The preview is production-connected
  to real D1: never reset it or run migrations for this feature.

## Example

```astro
<ResponsiveImage
  asset={media.asset}
  preset="content"
  sizes="(min-width: 1024px) 992px, calc(100vw - 16px)"
  fallback="/assets/curated-shots/media-fallback.png"
/>
```

Future Project consumers must set their own layout sizes. Video posters use a single URL,
capped at 1024px or the source width; native poster attributes do not support
srcset. Mounted video posters have their own bounded original/placeholder recovery.

## Validation and release limits

Previous byte measurements are historical and do not establish savings or visual approval
for the current automatic-format policy.
Byte savings vary by asset and candidate width; a resized image can be larger than its
compressed original. Network byte measurements are not whole-page speed scores.

Tests cover metadata, source safety, PNG/JPEG automatic-format policy, responsive detail candidates,
transformed largest candidates and preset caps, priority, dimensions, local passthrough, the build switch,
and bounded dynamic image recovery. Inspect real desktop/mobile currentSrc and visual
sharpness before release. Physical-device and full-page mobile performance checks remain
separate from format/byte verification. Commit, push and deployment need release approval.

Cloudflare reference: https://developers.cloudflare.com/images/optimization/features/
Responsive sizing: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/sizes

## Curated Projects integration

`fetchPayloadProjects(base)` in `src/lib/payload-curated-projects.ts` reads published
Projects with populated uploads and validated pagination. It normalizes the existing
`heroMedia` and `thumbnail` fields to the same `MediaAsset` used by Shots. Future Project
pages can pass these directly to `ResponsiveImage` with `hero` or `card` presets and
sizes matching their layout. Importing the adapter does not fetch or add a page.
Missing uploads remain undefined so the consuming component renders its placeholder.
The CMS collection now schedules the existing rebuild hook for publish, unpublish and
published deletion, while draft-only saves remain excluded. No galleries or page blocks
have been added: those require the future Project page content contract.

## Cloudflare configuration verified 2026-10-03

The `andreaschristofi.com` zone reports `image_resizing: on` (same-zone sources), not
`open` (arbitrary origins). The existing CMS subdomain source works through the URL
interface. No Images Worker binding, media hostname, bucket public access or configuration
mutation is needed. The application further restricts generated transformations to
`https://cms.andreaschristofi.com/api/media/file/`. Keep the zone restricted rather than
switching it to arbitrary origins. `IMAGE_TRANSFORMATIONS_ENABLED` is a build-time setting;
setting it to false requires a rebuild. Its default is enabled.

## Optimization bundle verification — 2026-10-03

- `npm run check`: 56 files, no errors, warnings or hints.
- Public CMS-backed build: 4 routes and 8 published Shots; all 52 website tests pass.
- Generated homepage HTML: 24 card instances (8 homepage + 16 related), 33 content images.
  All responsive candidates use transformed URLs, correct caps, intrinsic dimensions and
  existing sizes; cards remain lazy and 5 image leads retain eager/high priority inside
  inert overlay templates. No layout or hydration changes.
- Live ESA JPEG and EverFX PNG requests at 800/1024 return HTTP 200 AVIF when accepted;
  fallback Accept headers return JPEG/PNG. Responses include `Vary: Accept`, ETag and
  `Cache-Control: max-age=14400`; a repeated ESA request returned HIT.
- Original and revision-query CMS image responses returned HTTP 200 without explicit
  Cache-Control, ETag or Last-Modified headers in these samples. Initial Python-client
  requests received 403; curl succeeded, so challenge responses were excluded from findings.
- CMS R2 upload code sets content type, not cache lifetime. Reads use filename/object key;
  the `v` query is not an immutable revision lookup. Existing CMS immutable headers apply
  only to `/_next/static/*`. A long immutable media policy is not established as safe:
  replacement, deletion, query-sensitive cache keys and rebuild failure/invalidation need
  verification first. No cache policy, CMS files, storage or database changed.
- Neither repository contains tracked hard-coded `www.andreaschristofi.com` references.
  Astro canonicals use the apex; live www returns 301 to https://andreaschristofi.com/.
- Visual sharpness on high-density displays and new whole-page performance scores remain
  release checks. The 1024px card cap deliberately trades some high-DPR detail for bytes.
  Existing WebP/AVIF passthrough and incomplete-metadata safeguards remain intact.
