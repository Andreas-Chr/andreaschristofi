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
