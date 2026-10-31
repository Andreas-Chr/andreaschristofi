import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SEARCH_HIDDEN_SLUGS, projectHref } from './src/lib/curated-projects.ts';

// Search-hidden projects and their homepage card fragments stay out of the sitemap.
const unlisted = ['/404/', '/fragments/', ...SEARCH_HIDDEN_SLUGS.map(projectHref)];

export default defineConfig({
  site: 'https://andreaschristofi.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !unlisted.some(path => new URL(page).pathname.startsWith(path)) })],
});
