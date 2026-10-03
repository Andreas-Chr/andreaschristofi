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

## Current delivery policy

- Resize production CMS PNG/JPEG uploads only when valid dimensions are available.
- PNG: width-only `fit=scale-down`, omit format and quality options. Verified PNG responses
  retain PNG; no quality option is sent that could enable palette quantization.
- JPEG: width-only `fit=scale-down,quality=90,format=jpeg` for smaller candidates.
  Quality 90 is an encoding setting, not a statement of 10 percent perceptual degradation.
  Resizing and JPEG re-encoding still require visual review.
- The uploaded original, with its revision query, is always the largest candidate.
  Full-width requests avoid transformation and re-encoding entirely.
- `preserveResolution` remains an explicit original-only option, but Curated Shot detail
  images now use responsive resolution selection by default.
- Card/content presets include 1200px for high-density mobile screens. Smaller candidates
  never exceed the master width. Actual uploaded aspect ratios remain authoritative;
  CSS owns card cropping, and detail images retain their proportions.
- GIF, SVG, video, existing WebP/AVIF, unknown metadata, other origins and local sources
  pass through. Native video sources, embeds and animation behavior are unchanged.
- First detail image: eager/high priority. Other images: lazy, async decoding.
- `updatedAt` revisions both transformed sources and direct original candidates. Revisioned original URLs remain available for recovery: derivative -> original -> placeholder.
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

The earlier quality-90 AVIF/auto and quality-100 lossless WebP measurements are historical.
They do not establish savings or visual approval for the current native-format policy.
Byte savings vary by asset and candidate width; a resized image can be larger than its
compressed original. Network byte measurements are not whole-page speed scores.

Tests cover metadata, source safety, PNG/JPEG-specific policy, responsive detail candidates,
original full-width delivery, priority, dimensions, local passthrough, the build switch,
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
