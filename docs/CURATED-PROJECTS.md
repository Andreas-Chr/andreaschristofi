# Curated Projects (case studies)

Project pages live at `/projects/<slug>/` and are listed in the homepage **Case studies** section (between Process and Curated Shots) with the Project Card. Remdash is the first entry.

| Figma | Implementation |
| --- | --- |
| Project page `5603:860` (desktop only) | `src/pages/projects/[slug].astro`; tablet and mobile layouts derived from the site's existing breakpoints |
| Homepage section `5492:1725` | `src/components/CaseStudies.astro` (160px above; Curated Shots supplies the 160px below) |
| Project Card `5270:1396` | `src/components/ProjectCard.astro`: whole card is the link; the arrow follows Button/Icon hover/focus |
| Badge `5053:618` | `src/components/ToolBadge.astro`: 80px tile, 36px logomark slot, colour artwork on white for hover/focus, shared Tooltip |
| Users, Impact and Progression tiles | `src/components/ProjectTiles.astro` (`audience`, `stat`, `phase`) |
| Two-column stages (e.g. `5604:978`) | `src/components/ProjectStory.astro` |
| Visual cards (e.g. `5603:913`) | `src/components/ProjectVisual.astro` |
| Typography/ParagraphLink | Back link and “On this page” links |

## Content sources

`src/data/curated-projects.ts` uses the same switch as Curated Shots: Payload when `PAYLOAD_URL` is set, otherwise `src/content/curated-projects/*.json`. Both produce the model in `src/lib/curated-projects.ts`; the Payload adapter is `src/lib/payload-curated-projects.ts`. Local JSON is never merged with Payload content. Unpublished entries create no page; `featured: false` hides the card.

The CMS collection (`cms/src/collections/CuratedProjects.ts`) mirrors the model. `cms/scripts/seed-curated-project.ts` creates or updates a published entry from a local JSON file and uploads its images (filenames prefixed with the slug, reused on later runs).

## Page structure

- **Card & hero:** title, slug, card subtitle, card image (falls back to the hero), hero image, optional meta description, order, show on homepage.
- **Overview:** rich-text overview, then facts in this order: Role, client label + client, Year, Collaborators (`CTO, PM & Engineering`), Industry, Status. Empty facts are omitted.
- **On this page:** generated from the challenge label and every section with an “On this page label”; each gets a unique anchor.
- **Challenge & stack:** eyebrow, heading, rich-text body; stack eyebrow/heading/intro and tools. A tool badge needs an icon from the website tool set (`public/assets/tools`).
- **Users:** heading and tiles.
- **Sections**, in order:
  - **Tiles**: heading, rich-text introduction, `stat` (64px figures) or `phase` (40px uppercase) tiles.
  - **Two-column story**: eyebrow, heading (line breaks kept), rich-text introduction; right-column items with label, rich-text body and optional closing statement. `compact` uses 24px between items.
  - **Visual card**: caption, layout, spacing, gap after a previous card, bleed, images.

Rich text keeps the website text styles chosen in the CMS editor (`$.websiteTypography`), rendered by `src/lib/rich-text.ts` as the matching `text-*` class. Unstyled paragraphs are Body/Medium in both the editor and the site. The Remdash content uses Display/Medium for leads and Display/Small for supporting paragraphs, as in Figma.

## Visual cards

Captions split on `/`: the first part is regular, later parts bold, separators lime (`description / share of voice 2.0 / share of voice 3.0`).

Image `width`, `offsetX` and `offsetY` are percentages of the card's image area, so a composition scales identically at every width. `stack` centres images in a column (32px, or 16px when compact); a negative top offset pulls an image into the caption gap and widths above 100% bleed past the card padding. `overlap` layers images in one grid cell using the offsets. Corners: none, small (16px; 8px below 640px) or large (24px; 16px). `bleed: bottom` removes the card's bottom padding so the last image runs into the card edge.

## Images

Remdash artwork is in `public/assets/curated-projects/remdash/` and in the CMS Media library. Sources came from the Figma fills (16.1 MB) and were converted with sharp to 2.7 MB of WebP at their original resolution: quality 92 with sharp YUV, or lossless where that was smaller (three files). Images that Figma crops (monitor mockup, both Share of Voice screenshots, dashboard folders) were cropped to exactly the visible region. From the CMS, these WebP files get responsive Cloudflare variants like PNG/JPEG (`docs/IMAGE-DELIVERY.md`). The hero, card and visual images use the `hero` preset (up to 2560px) so full-width screenshots stay sharp on high-density screens; local `/assets` copies are served as-is. Captions use Zalando Sans Expanded Bold, added as `zalandosansexpanded-bold.woff2` (OFL) from the locally installed font.

## Responsive behaviour

Desktop (≥1200px) follows Figma. Below 1200px the challenge/stack and story columns stack, tiles use two columns (an odd last tile spans both) and section spacing uses `--section-space`. Below 640px tiles use one column, overview gaps reduce to 48px, Display/Medium paragraphs drop to 24/36, visual cards use 24/8/8px padding and smaller corners, and the Project Card becomes square. Stat figures follow the site heading scale (64 → 40 → 32px). Verified without horizontal overflow from 1920 to 320px.

## Adding a project

Create it in Payload (or add `src/content/curated-projects/<slug>.json` for local work), publish, and rebuild the site. To copy a local file into the CMS: `npm run payload -- run scripts/seed-curated-project.ts ../website <slug>` from the CMS repository (local emulator by default).

## Production release (not yet performed)

The production CMS does not have these fields or the Remdash entry yet, so a CMS-backed build currently omits the Case studies section and the page. In order, with release approval:

1. CMS: apply `20261031_110023_curated_project_pages` (additive: new columns and block tables; Curated Shots untouched) with `npm run deploy:database`, then `npm run deploy:app`.
2. CMS: `NODE_ENV=production npm run payload -- run scripts/seed-curated-project.ts ../website remdash` uploads the 24 images to R2 and publishes the entry in D1. It does not trigger a website build.
3. Website: rebuild and deploy so the CMS-backed build picks up the published project.
