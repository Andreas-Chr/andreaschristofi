import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { SEARCH_HIDDEN_SLUGS, formatList, projectAnchors, projectCardFragmentId, projectDescription, projectFacts, projectHref, richTextPlain, validateProjects } from '../src/lib/curated-projects.ts';
import { richTextHTML } from '../src/lib/rich-text.ts';

const dir = new URL('../src/content/curated-projects/', import.meta.url);
const entries = readdirSync(dir).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(new URL(file, dir))));
const remdash = entries.find(entry => entry.slug === 'remdash');

test('local Remdash content validates and every referenced image is a WebP in public assets', () => {
  assert.equal(validateProjects(entries)[0].slug, 'remdash');
  const assets = [remdash.heroMedia, remdash.thumbnail, ...remdash.sections.flatMap(section => (section.images ?? []).map(item => item.image))];
  assert.equal(new Set(assets.map(asset => asset.url)).size, 24);
  for (const asset of assets) {
    const file = new URL(`../public${asset.url}`, import.meta.url);
    assert.ok(existsSync(file) && statSync(file).size > 0, asset.url);
    assert.equal(asset.mimeType, 'image/webp');
    assert.ok(asset.alt.trim() && asset.width > 0 && asset.height > 0, asset.url);
  }
  assert.deepEqual([...new Set(remdash.sections.map(section => section.blockType))].sort(), ['story', 'tiles', 'visual']);
});

test('project facts, list formatting and anchors follow the Figma metadata and navigation', () => {
  assert.equal(formatList(['CTO', 'PM', 'Engineering']), 'CTO, PM & Engineering');
  assert.equal(formatList([' Solo ']), 'Solo');
  assert.deepEqual(projectFacts(remdash).map(fact => fact.label), ['Role', 'Employer', 'Year', 'Collaborators', 'Industry', 'Status']);
  assert.equal(projectFacts({ client: 'Client', clientLabel: ' ', order: 1 }).at(0).label, 'Client');
  const anchors = projectAnchors(remdash);
  assert.deepEqual(anchors.links.map(link => link.label), ['Overview', 'Impact', 'Progression', 'Design system', 'Market intelligence', 'Analytics', 'Operations', 'Bulk Content AI', 'Body of work', 'Learnings']);
  assert.equal(anchors.overview, 'overview');
  assert.equal(anchors.sections.filter(Boolean).length, 9);
  const duplicate = projectAnchors({ challenge: { navLabel: 'Impact' }, sections: [{ blockType: 'tiles', navLabel: 'Impact' }] });
  assert.deepEqual(duplicate.links.map(link => link.href), ['#impact', '#impact-2']);
});

test('rich text keeps website text styles and project descriptions stay short', () => {
  assert.match(richTextHTML(remdash.summary), /^<p class="text-display-medium">In 2022/);
  const learnings = remdash.sections.at(-1).items.at(-1);
  assert.match(richTextHTML(learnings.body), /<strong>More research before building\.<\/strong>/);
  assert.ok(learnings.closing);
  assert.ok(projectDescription(remdash).length <= 160);
  assert.equal(richTextPlain('  Plain  '), 'Plain');
  assert.throws(() => validateProjects([remdash, remdash]), /duplicate/);
  assert.equal(validateProjects([{ ...remdash, published: false }]).length, 0);
});

test('search-hidden projects are blocked in robots.txt and _headers behind an opaque card fragment', () => {
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  const [everyone, ai] = robots.split('\n\n').map(group => `${group}\n`);
  assert.ok(SEARCH_HIDDEN_SLUGS.includes('remdash'));
  for (const group of [everyone, ai]) assert.match(group, /^Disallow: \/fragments\/$/m);
  assert.match(ai, /^User-agent: GPTBot$/m);
  assert.match(headers, /^\/fragments\/\*$/m);
  for (const slug of SEARCH_HIDDEN_SLUGS) {
    const artwork = [`/assets/curated-projects/${slug}/`, `/cdn-cgi/image/*/api/media/file/${slug}-`];
    for (const path of artwork) for (const group of [everyone, ai]) assert.ok(group.includes(`Disallow: ${path}\n`), path);
    // Search engines must still be able to fetch the page to see its noindex.
    assert.ok(!everyone.includes(`Disallow: ${projectHref(slug)}\n`) && ai.includes(`Disallow: ${projectHref(slug)}\n`));
    for (const path of [projectHref(slug), artwork[0]]) assert.ok(headers.includes(`\n${path}*\n  X-Robots-Tag: noindex`), path);
    assert.match(projectCardFragmentId(slug), /^[0-9a-f]{16}$/);
  }
});
