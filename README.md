# andreaschristofi.com

Static Astro implementation of the approved Figma V1 portfolio: Home, Privacy & Cookie Policy, and custom 404. Uses the supplied production assets, local WOFF2 fonts, and CV. Work galleries and project routes remain V2 scope.

## Development

Use Node 24 LTS (the build was verified with 24.18.0) and npm.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm test
npm run preview
```

Tests read the production output, so build before running them. Astro generates `dist/index.html`, `dist/legal/index.html`, and `dist/404.html`. The canonical origin is `https://andreaschristofi.com` and routes use trailing slashes.

## Structure

- `src/pages/`: the three V1 routes.
- `src/components/`: shared header/footer, Process, Experience, hero and decorative background.
- `src/data/`: site destinations, exact Figma process/experience/legal copy.
- `src/styles/`: local fonts, semantic design tokens, shared styles.
- `src/scripts/disclosure.ts`: interruptible disclosure transitions and focus handling.
- `public/assets/`: supplied/exported SVG artwork, fonts, licenses, CV.
- `src/assets/`: original raster assets optimized by Astro into AVIF/WebP/JPEG.
- `tests/site.test.mjs`: production route/asset and DOM interaction checks.

Core content and links are rendered as HTML. Menu/contact content and all process/experience descriptions are visible before enhancement. Process permits exactly one open phase after initialization; experience items open independently. The menu is non-modal. The only React island is the original React Bits Gradient Waves effect, with static and reduced-motion fallbacks.

## Design sources

[Figma file](https://www.figma.com/design/FXrcGSbJF7X4lbbGanlb6d/andreaschristofi.com), pages 03–05 and 07. The originally supplied node is the cover page; the handoff explicitly excludes the cover and defines V1.

Desktop Home `5303:3403`, mobile Home `5314:8280`, Legal `5314:11138`, and 404 `5314:11317` were used alongside responsive references. SVG process diagrams were exported from their actual artwork nodes. No page screenshots are used as layout.

[Astro React integration](https://docs.astro.build/en/guides/integrations-guide/react/) and [React Bits Gradient Waves source](https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/GradientWaves) informed the isolated wave integration. Vendored code includes its upstream license; fonts retain their supplied OFL notices. See `docs/ASSETS.md` and `docs/RELEASE-REVIEW.md` for provenance and remaining launch checks.

## Static hosting

For Cloudflare Pages, use `npm run build`, output directory `dist`, and Node 24. No server adapter is needed. Publishing, GitHub push, custom-domain changes, and analytics setup were not performed as part of this local implementation. Verify unknown paths return the custom page with HTTP 404 on the actual host before launch.
