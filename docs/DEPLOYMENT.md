# Production deployment

The existing Cloudflare Worker `andreaschristofi` serves https://andreaschristofi.com.
Cloudflare Workers Builds tracks `Andreas-Chr/andreaschristofi`, branch `main`, repository root.

- Build: `npm run build`
- Deploy: `npx wrangler deploy`
- Build variables: `PAYLOAD_URL=https://cms.andreaschristofi.com`, `NODE_VERSION=22.23.2`
- Local build configuration: copy `.env.example` to `.env`.
- Local deployment: `npm run deploy` with the existing Cloudflare account login.

## Content workflow

Publish a Curated Shot in https://cms.andreaschristofi.com/admin. Publishing, updating a published shot, unpublishing, deleting published shots, and updating/deleting Media request a production rebuild through the `Payload content publishing` deploy hook. Draft saves do not request builds. New uploads are included when the shot is published.

The CMS stores the hook URL only in the `WEBSITE_DEPLOY_HOOK_URL` Cloudflare secret. Never commit that URL. The hook rebuilds the latest `main` branch, so push frontend changes before expecting them in content-triggered builds.

Updates appear after a successful Cloudflare build, not instantly. Check Workers & Pages > andreaschristofi > Deployments/Builds for progress. Failed builds preserve the last successful deployment; retry from Cloudflare after fixing the error. Hook delivery retries once and logs failures in the CMS Worker.

The production data fetch fails on CMS/API errors instead of publishing local placeholders. CMS media must be publicly accessible. The Curated Projects collection is not connected to this frontend.

Reference: https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/
