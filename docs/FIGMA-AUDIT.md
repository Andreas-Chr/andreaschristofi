# V1 implementation audit — 7 September 2026

This is a source-level Figma comparison and local build review, not a completed visual or accessibility sign-off.

## Discover: evidence and coverage

Live Figma file: `FXrcGSbJF7X4lbbGanlb6d`. Inventoried all nine pages and all 18 V1 responsive frames. Read the canonical V1 handoff, header owner description, relevant color/motion variables, all six Home section-layout metrics, selected responsive header/hero/footer details, and the prototype frame inventory. Retrieved design context and screenshots for Home 1440 and 320, Legal 1440, and 404 1440. Large context responses were supplemented by targeted structural reads; this is not an exhaustive descendant or prototype-connection audit.

| Width | Home | Legal | 404 |
| --- | --- | --- | --- |
| 1920 | 4966:246 | 5193:3474 | 5201:2241 |
| 1440 | 5303:3403 | 5314:11138 | 5314:11317 |
| 1024 | 5314:6850 | 5314:11501 | 5314:11898 |
| 768 | 5314:7010 | 5314:11590 | 5314:11983 |
| 480 | 5314:8120 | 5314:12260 | 5314:12540 |
| 320 | 5314:8280 | 5314:12349 | 5314:12625 |

## Define: implementation contract

Confirmed scope: Home, `/legal/`, custom 404, shared header/footer, Process, Experience, CV links, contact and decorative effects. Work/project/shot routes, overlays, collections, NDA and testimonials remain deferred.

Current source supersedes the skill's historical portfolio reference: enhanced menu starts Closed on every route (`5166:10`); header appearance does not change on scroll (`5162:10`, owner `5069:1025`); canvas is #121212; the continuous marquee remains an explicit owner decision with an unresolved accessibility limitation (`5165:10`). At 1024 the actual header gutter is 16px, consistent with the 992px container.

Preserve the existing Astro version and lockfile. No deployment, Figma edits, analytics setup, policy rewriting, or new sharing artwork is included in this audit.

## Develop: findings and changes

| Status | Finding and impact | Source | Action / evidence |
| --- | --- | --- | --- |
| ✅ Source fix | Header centered both controls instead of separating them; full wordmark disappeared at 480. | Header rows under `5303:3404`, `5314:8121`, `5314:8281` | Restored space-between; compact mark only below 400px. Browser fit pending. |
| ✅ Source fix | Added full-header blur/shadow contradicted the component owner. | `5069:1025` | Removed effects; retained fixed positioning and nonmodal disclosure. |
| ✅ Source fix | Hero fixed to 100vh could let tall grid content escape into Process. The 100vh measurement belongs to motion progress. | `5163:10`, `5166:4`, `5303:3406` | Removed fixed hero height; preserved independent 100vh motion measurement. Full responsive composition remains partial. |
| ✅ Source fix | 480px hero CTA stretched full width and copy spacing differed. | `5314:8124`, `5314:8131` | Restored intrinsic CTA width, 48px copy gaps/padding and decorative bottom offset. |
| ✅ Source fix | Footer used a 160px mobile vertical inset, oversized narrow type/icons, and horizontal contact too early. | Footer instances under all six Home frames | Restored 320px inset, 32/48/64/80px heading sizes, 48/64/80px arrows, 448px narrow contact width, and desktop contact columns. Footer information becomes horizontal at 1024. |
| ✅ Source fix | Smallest Stack/Awards spacing and tool artwork size differed. | `5314:8328`, `5314:8411`, Home desktop context | Applied 48px section inset at smallest width and 36px tool artwork. |
| ✅ Regression verified | Wave fallback file existed but no image was rendered, leaving no artwork before hydration or after renderer failure. | `5166:7`, `5166:10` | Restored supplied image outside the React island. Build produces a ~9KB WebP. Regression checks require a decorative server-rendered fallback on all three routes. |
| ⚠ Partial | Tablet hero artwork is absolutely positioned in Figma; production keeps it in normal flow. 1920 hero proportions and scroll endpoint still need matching in the browser. | `5314:6862`, `5314:7022`, `5104:1577` | Kept content-safe flow; do not claim pixel parity or F13 completion. |
| ⚠ Unverified | Full viewport comparisons, font wrapping, focus visibility, live waves and responsive failure states. | `5165:7`, `5165:10` | Browser control unavailable through tab provider; native navigation encountered user activity and a clipboard timeout. No rendered-site screenshots obtained this run. |
| ❌ Open limitation | Automatic marquee has no pause/stop/hide control. | `5165:10`, `5166:4` | Preserve explicit owner decision; do not claim full WCAG AA conformance. Review waves alongside it. |

## Deliver: local verification

- `npm run check`: 19 files, zero errors/warnings/hints.
- `npm run build`: Home, Legal and 404 generated successfully.
- `npm test`: all seven tests pass, including the new wave regression assertion on every route.
- Local production preview HTTP responses: Home 200, Legal 200, unknown route 404. The network sandbox initially blocked these checks; verified outside it.
- `git diff --check`: clean.
- Preview: http://127.0.0.1:4321 (Astro preview running). This does not verify Cloudflare.

## User journeys and edge cases

| Journey | Required edge/error/empty states | Evidence |
| --- | --- | --- |
| [Open menu] → [Anchored card expands] → [Tab into links]; [Escape/Close] → [Card collapses, trigger regains focus] | Short viewport; repeated toggles; outside click; no JS; anchor navigation must survive closing | Automated DOM checks; real keyboard/geometry pending |
| [Select phase] → [Exactly one description and matching artwork shown] → [Selected phase] | Re-select active phase; all five transitions; no JS exposes all descriptions; missing art leaves text usable | Automated DOM checks; mobile artwork/focus pending |
| [Toggle experience] → [Independent expanded/collapsed state] → [Same section] | All items closed; several long items open; narrow/zoomed text; no JS | Automated DOM checks; rendered overflow pending |
| [Contact CTA] → [Email/social panel] → [Close restores CTA focus] | No JS; short viewport; interrupted closing; mailto depends on configured email handler | Automated DOM checks; pointer/touch pending |
| [Download CV] → [Native PDF download] → [Reader/file] | Missing PDF; final content and accessible PDF structure | Local file/link integrity checked; owner content/accessibility review remains |
| [Unknown URL] → [404 recovery page] → [Return Home] | Deep unknown path; host must return HTTP 404 rather than soft 404 | Local status checked; Cloudflare pending |

## Focused Nielsen heuristic review

| Heuristic | Assessment / next action |
| --- | --- |
| Visibility of system status | Expanded state and selected phase exposed; visually verify focus and transitions. |
| Match with real world | Process/About labels and native email/download actions are clear. |
| User control and freedom | Escape/Close and independent Experience work in DOM tests; continuous motion remains a control gap. |
| Consistency and standards | Shared components and restored responsive header/footer values; browser comparison pending. |
| Error prevention | No dead Work links; native links and asset checks reduce broken destinations. |
| Recognition rather than recall | Persistent menu trigger and named phase controls; confirm their visibility over artwork. |
| Flexibility and efficiency | Keyboard and anchors supported; real keyboard and enlarged-text checks remain. |
| Aesthetic and minimalist design | V2 content remains excluded. Large footer whitespace follows Figma; reassess only if owner requests redesign. |
| Recognize, diagnose, recover from errors | 404 has Home recovery; wave failure retains static artwork. |
| Help and documentation | Legal contents and contact paths exist; final deployed services must match approved policy. |

## Remaining release gates

Full visual matrix at 1920/1440/1024/768/480/320 and intermediate widths; 200% zoom; short-height screens; reduced motion; no-JS and renderer/media failures; real keyboard/touch and assistive technology; browser console/network review. Resolve tablet/1920 hero composition and F13 using rendered geometry.

Owner/external inputs still needed: approved sharing image, final CV/content review, Cloudflare configuration and analytics identifier/decision. Validate actual domain/HTTPS/redirects/404, deployed policy alignment, and external links before launch. No deployment or launch-readiness sign-off was performed.
