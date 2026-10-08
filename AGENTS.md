# Agents

## Validation after code changes

Run commands from this repository root with a Node version supported by `package.json` and the installed Astro version. Use the existing npm scripts and locally installed tooling; do not invent scripts or download tools to make a check appear available.

Before marking code changes complete:

1. Run the configured ESLint check if available. Currently this repository has no ESLint dependency, configuration, or lint script; explicitly report ESLint as unavailable. If lint tooling is added, use its actual project command.
2. Run `npm run check` (Astro and TypeScript diagnostics).
3. Run `npm run build` (production Astro build).

Attempt each available check even if another fails. Fix failures caused by the task, then rerun affected checks. Report the commands run, outcomes, warnings, failures, and any skipped or unavailable checks with reasons. Do not claim full validation while required checks fail or remain unrun; distinguish pre-existing or environment failures from task regressions without changing unrelated code or weakening checks.

Use the configured CMS-backed build. If `PAYLOAD_URL= npm run build` is needed as a fallback, label it as an offline/static build and report that CMS-backed validation remains incomplete.

Do not push or deploy without explicit user authorization. `npm run deploy` publishes the site; it is not a validation command.
