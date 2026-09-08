# V1 release review

Latest implementation: [8 September Figma handoff audit](FIGMA-AUDIT.md).

Home, Legal and custom 404 are implemented locally, including the revised loader, navigation, Process, single-open Experience, contact replacement and renderer fallback. Production build, type checking and seven DOM tests pass. Browser matrix and failure-check evidence is documented in the audit and `docs/qa/`.

The site is ready for local owner review, not a claim of public launch readiness. Before publishing:

- Review the five responsive layouts on real devices and complete zoom, keyboard, touch and assistive-technology acceptance.
- Supply approved sharing artwork for OG/Twitter image metadata; review the supplied CV and external profiles.
- Configure and verify Cloudflare, domain/HTTPS, canonical redirects, real unknown-route HTTP 404 behavior, analytics and deployed policy alignment.
- Retain the recorded continuous-motion accessibility limitation until the owner changes that behavior.

No GitHub push, deployment, analytics setup or policy wording rewrite was performed.

To reproduce browser checks, make Playwright available through `PLAYWRIGHT_MODULE` (module specifier or absolute entrypoint), start a production preview, set `QA_ORIGIN` to its URL, and run `node scripts/verify-browser.mjs` , `node scripts/verify-failures.mjs`, and `node scripts/verify-edge-cases.mjs`. `CHROME_PATH` can override the browser executable; `QA_OUTPUT` sets the screenshot/report directory for the matrix. The default local preview URL is `http://127.0.0.1:4323`.
