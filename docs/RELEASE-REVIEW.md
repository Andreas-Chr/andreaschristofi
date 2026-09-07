# V1 release review

Latest review: [7 September Figma implementation audit](FIGMA-AUDIT.md). Source mismatches in the header, hero sizing, responsive footer and missing wave fallback were corrected. Check/build and seven automated tests pass; local production preview returns 200/200/404. Full browser fidelity remains unverified because browser control could not complete navigation during this run. The detailed audit separates source fixes from rendered verification and records remaining hero geometry differences.

## Implementation and evidence

- Home, `/legal/`, and `404.html` generate successfully with static Astro.
- Type checking and the production build pass.
- Automated DOM checks cover baseline no-JavaScript content, menu Escape/focus/navigation, one-open Process, independent Experience, contact Escape/focus, animated closing interactivity, and local assets/canonical/anchor/sitemap integrity.
- The homepage was opened in Chrome from the local server and its content/initial control state was present.
- Local HTTP checks returned Home 200, Legal 200, and an unknown route 404. This does not verify the eventual Cloudflare configuration.
- SVGs parse; all generated page references to local assets resolve; the supplied CV is a real PDF.
- Instagram and Dribbble returned HTTP 200. LinkedIn returned its automated-request restriction (HTTP 999); the URL is the exact owner-supplied Figma destination and still needs a manual reachability check.

## Browser acceptance still required

The DOM tests do not measure rendering, typography, contrast, WebGL output, or browser viewport geometry. Full visual comparisons at 1920, 1440, 1024, 768, 480, 320 and intermediate widths remain unverified. Also test short viewports, 200% zoom, keyboard-only navigation, VoiceOver/Safari, NVDA, forced colors, reduced motion, disabled JavaScript, and renderer/asset failure on real browsers. No full WCAG conformance claim is made.

The hero uses a measured CSS `100vh` range. Actual Figma endpoint travel is 197/546 for Large, 156/393.795868 for Medium, and 124/276.477386 for Small. The older 194-unit example does not match the latest Large Closed position. Verify that the hero's page bounds are outside the viewport at the 100vh endpoint, especially on tablets and with enlarged text; the content can extend past that range. The specified linear endpoint is retained without pinning or extra scroll distance.

Menu placement is below the persistent trigger so that focus left on the trigger remains visible when the card opens. It remains anchored, non-modal, scrollable on short screens, and closes on Escape or link activation.

## Before public launch

- Configure Cloudflare hosting/security and cookie-free analytics to match the supplied policy. No analytics identifier was provided, and no analytics script is currently included. The approved policy copy and fixed 31 August 2026 date were preserved rather than rewritten.
- Supply/approve a dedicated 1200×630 sharing image, then add the Open Graph/Twitter image metadata. Current metadata uses a text-only summary; no substitute sharing artwork was invented.
- Review the supplied CV for final content and PDF accessibility. Both Download CV links already point to the provided PDF.
- Review source and content; verify production domain, HTTPS, canonical/trailing-slash redirects, sitemap and actual unknown-route HTTP 404 behavior.
- Run the owner’s “Review V1 launch readiness” checklist before publishing. GitHub push and deployment are not part of this local delivery.

## Recorded motion limitation

The continuously moving marquee intentionally has no pause/stop/hide control, following the handoff. Reduced motion produces one stationary, readable phrase sequence. The Figma F18 limitation remains: reduced-motion support alone does not satisfy WCAG 2.2 SC 2.2.2 for continuous nonessential motion. Include live waves in the same release review.
