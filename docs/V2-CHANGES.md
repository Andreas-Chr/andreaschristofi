# V2 design changes

Design audit and local implementation: 14 September 2026.

Source: [andreaschristofi.com in Figma](https://www.figma.com/design/FXrcGSbJF7X4lbbGanlb6d/andreaschristofi.com). Scanned Foundations, Components, Desktop, Tablet, Mobile, Prototype, Behaviour & Handoff Notes, and V2 / Deferred. The cover is not a website screen. Current owner instructions and responsive designs supersede the old V1 hero and education specifications. The existing V1 audit remains historical.

## Implemented

| Area | V2 change | Source |
| --- | --- | --- |
| Hero visual | Removed remaining diamond layout rules and four unused hero diamond PNGs. The diamond component was already absent from the current website markup and Figma library. Process illustrations remain. | Components `5030:2821`; responsive heroes below |
| Hero heading | One semantic H1, centered. Static “Building” above green Vision → Clarity → Systems → Hype. A shared CSS fold animation keeps the heading dimensions stable. | Desktop `5303:3405`; owner-specified word order and fold effect |
| Hero copy | “Senior Web & Product Designer crafting brand-led digital experiences & shaping AI-powered SaaS products.” Also used by the shared site description. | Desktop `5303:3411`; matching tablet/mobile heroes |
| Process | “This is the way” becomes “Approach.” Added the full new paragraph beginning “Great design comes from research…” and ending “Complex problems require dependable outcomes.” | Desktop intro `5448:6051` / paragraph `5460:3956` |
| Experience | Renamed “Experience & education” to “Experience.” Removed Northumbria University Newcastle and Frederick University Nicosia. Six professional entries remain in their original order. | Desktop `5303:3451`, matching tablet/mobile stacks |
| About | New desktop heading “About,” revised introduction, revised first biography paragraph, and “Resume” download label applied consistently. See source discrepancy below. | Desktop `5303:3439` |
| Header | Removed a stray global Astro-scope selector that forced every header element to 16 × 16 px. Restored full-width alignment, the 48 × 64 px logo surface, 16 px logo gap and 188 × 15 px wordmark. Preserved the burger/menu behavior and narrow-screen logomark-only layout. | Desktop `5303:3404`; tablet `5314:6851` / `5314:7011`; mobile `5314:8121` / `5314:8281` |
| Interaction safeguards | Headline has a stable accessible name, a pause/resume control, and static Vision without JS or with reduced motion. Background tabs pause the animation. Existing accordion keyboard behavior and readable no-JS content remain. | Implementation safeguards |

The Contact Popup remains standalone. No new route, Works collection, or deployment was added.

## Responsive measurements

| Reference viewport | Hero H1 | Hero paragraph | Approach paragraph | Intro → illustration gap |
| --- | --- | --- | --- | --- |
| 1440 | 64 / 72 px | 20 / 36 px, medium | 40 / 64 px, regular | 80 px |
| 1024 | 64 / 72 px | 20 / 36 px, medium | 40 / 64 px, regular | 160 px |
| 768 | 64 / 72 px | 20 / 36 px, medium | 40 / 64 px, regular | 160 px |
| 480 | 40 / 64 px | 20 / 36 px, medium | 32 / 48 px, light | 40 px |
| 320 | 32 / 48 px | 16 / 32 px, regular | 20 / 36 px, medium | 40 px |

Hero content is at most 684 px wide with 48 px gaps. Approach heading → paragraph is 40 px. Existing page gutters and the 1440 px outer maximum are retained. Font size / line height values above are CSS pixels.

Responsive hero sources: `5303:3405` (1440), `5314:6852` (1024), `5314:7012` (768), `5314:8122` (480), `5314:8282` (320). Approach intro sources: `5448:6051`, `5460:6047`, `5460:6053`, `5460:6059`, `5460:6065` respectively.

## Provisional decisions and source discrepancies

These were raised during implementation; no owner answer had arrived when the defaults were applied.

1. **Hero buttons:** all five updated screens show “Curated Works” and “Say Hello,” with no prototype destinations. The website has no Works route, and the earlier instruction explicitly left Contact Popup unattached. Retained the working Download CV button pending destination/integration decisions. Do not ship a dead Works link.
2. **Fold timing:** `get_motion_context` on the hero returned an empty animated-node inventory. The prototype has no hero reactions. Implemented a provisional 600 ms transition, 2.4-second hold, 12-second full loop, `cubic-bezier(.4,0,.2,1)`. These values are implementation choices, not exported Figma values.
3. **Hero height:** tablet frames retain 1288 / 1376 px hero heights, despite the removed visual. Used a viewport-filling home region with a content-based minimum height to keep the centered content reachable on short screens. The home override does not change Legal or 404 sizing.
4. **About copy:** only the desktop screen has the new wording and Resume label; tablet/mobile and the menu-open prototype retain older copy. Used the newer desktop copy consistently rather than changing wording by viewport.
5. **Motion control:** the small Pause/Resume animation button is an implementation addition to let visitors stop the looping headline. Reduced motion disables the fold and hides this control.
6. **Historical notes:** page 07 still describes V1, the hero diamond and eight Experience/Education entries. Page 08 retains Work Index, projects and shots. Moving into V2 does not supply final content or destinations for those additional features; this change implements the reviewed homepage update.

## Validation

- `npm run check`: zero errors, warnings or hints.
- `npm run build`: Home, Legal and custom 404 built.
- `npm test`: 14 passing tests, including stable heading/word order, six-entry content, pause/resume, reduced-motion preference changes, duplicate initialization, and existing disclosure regressions.
- Chrome UI inspection: centered hero at 320, 480, 768, 1024 and 1440 px; pause/resume control works. These are emulated desktop-browser checks, not real-device acceptance.
- Chrome UI inspection after the header repair: logo, wordmark and menu button render at the correct desktop positions. Responsive header dimensions were checked against all five Figma references; a fresh mobile screenshot of the repaired header remains outstanding.
- At 320 × 320 px, the hero grows with its content and the download/pause controls remain reachable. The new Approach section renders below it.
- No deployment performed.

## Homepage v2 update — 29 October 2026

Source: Desktop `03.1 - Homepage v2 - 1440` (`5303:3403`) and Components `Site/Header` (`5314:5958`). 
| Area | Change | Source |
| --- | --- | --- |
| Order | Hero → Process → Marquee → Curated Shots → About → Stack & Experience → Awards → Footer. About is not in v2; kept after Curated Shots by owner decision. | `5303:3403` |
| Hero | `andreas christofi` (DM Sans 32/40) is the H1; the rotating “Building …” line follows. New copy “Senior Product & UX Designer shaping AI-powered SaaS products & crafting brand-led experiences.” (also the site description). Buttons “Explore Work” and “Book a Call” (opens the contact popup, owner decision). 32 px gaps. | `5303:3406` |
| Hero background | Gradient Waves, the vendored React Bits code and `ogl` removed. `hero_bg` image, lighten at 50%, in every page's top region (owner decision: same pages as the waves). | `5709:5266` |
| Header | Wordmarks removed. Logo is a bare 28 × 48 mark; the lime surface appears only on hover/focus. | `5069:1030`, `5314:5958` |
| Marquee | Homepage carries the Marquee component after Process. The footer marquee is removed from every page (homepage per v2, Legal and 404 by owner decision). | `5730:1865`, `5709:5507` |
| Curated Shots | Visible “Curated shots” H2, 40 px above the grid. | `5722:2128` |
| Process | The Process/Step accordion is removed from the homepage (owner decision); only the intro paragraph remains. The component stays on the Design System page. | `5303:3434` |
| Stack | “Research & Prototyping” label; Figma removed from that group. 8 px title gap, 32 px group spacing, 12 px label gap. | `5303:3454` |
| Experience | Updated Remazing copy; uppercase role/year line; 32 px heading gap. | `5303:3484` |

| Fonts | Added DM Sans Bold (`dmsans-bold.woff2`, owner-supplied `_exports/WOFF2/DMSans-Bold.woff2`) for the hero name. There is no SemiBold file: 600 text uses `--font-family-secondary-semibold`, a Medium-only alias, so the browser keeps synthesising it rather than switching to Bold. | `5717:852` |

Not changed: the home hero height, set to 90svh (owner decision; Figma shows a 1024 px top region), the open menu (owner decision) and the FAQ menu link (no FAQ section yet, owner decision). Tablet and mobile Figma frames predate v2; the new structure applies at every breakpoint.

## Homepage v2 update — 30 October 2026

Source: Desktop `03.1 - Homepage v2 - 1440` (`5303:3403`). Tablet and mobile frames still predate v2; the desktop structure applies at every breakpoint.

| Area | Change | Source |
| --- | --- | --- |
| Order | Hero → Process → Curated Shots → About → Stack & Experience → Marquee → Awards → Footer. The Marquee moves below Stack & Experience. | `5303:3403`, `5730:1865` |
| Hero | The `andreas christofi` H1 is removed; the rotating “Building …” line is now the page H1. New copy “I’m Andreas, an independent Product & UX Designer that builds AI-powered SaaS products & brand-led web experiences.” on a 600 px measure. | `5303:3406`, `5303:3411` |
| Hero background | Looping video replaces the `hero_bg` image: color dodge at 50%, fading into the canvas. Seamless loop: the clip's end dissolves into its start over 2.5 s instead of cutting. Homepage only (owner decision); Legal, 404 and the Design System page have no hero background, matching Figma. See `ASSETS.md`. | `5734:4924` |
| Process | No vertical padding (owner confirmed), matching the 288 px section; the hero and Curated Shots supply the spacing. | `5303:3434` |
| Curated Shots | New Display/Small intro paragraph, 40 px below the H2 and above the grid. | `5734:2132` |
| About | H2 `andreas christofi` (Black + Light). New 448 × 527 portrait crop, 80 px from the copy (proportional columns from 900 px; capped at 448 px when stacked). 24 px copy rhythm. Introduction now “… that builds AI-powered SaaS products & brand-led web experiences.” (also the site description). | `5734:4592` |
| Header | Wordmark `andreas christofi` restored beside the mark (Black + Light, 18/24); stacked below 480 px. The whole logo is one home link. | `5314:5958` |
| Fonts | Added Zalando Sans Expanded Light (`zalandosansexpanded-light.woff2`, Google Fonts latin subset, OFL) for the wordmark and About H2. | `5734:4804`, `5734:4598` |

Not changed (owner decisions): the 90svh home hero height (Figma shows 1024 px) and the footer contact block, which stays top-aligned with the heading rather than centered as in Figma. At 1440 × 900 every other section matches the Figma section heights. Tablet and mobile Figma frames will be updated by the owner; until then the desktop structure applies at every width.
