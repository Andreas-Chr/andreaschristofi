import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPayloadProjects, fromPayloadProject } from '../src/lib/payload-curated-projects.ts';
import { getImageProps } from '../src/lib/image-delivery.ts';
const base = 'https://cms.andreaschristofi.com';
const upload = { id: 1, url: '/api/media/file/project.jpg', alt: 'Project interface', mimeType: 'image/jpeg', width: 1800, height: 1200 };
const doc = { id: 2, slug: 'project', title: 'Project', client: 'Client', order: 1, _status: 'published', heroMedia: upload, thumbnail: upload };

test('Project hero and thumbnail reuse media metadata and responsive delivery', () => {
  const project = fromPayloadProject(doc, base);
  assert.equal(project.heroMedia.alt, upload.alt);
  assert.equal(project.thumbnail.width, 1800);
  for (const [asset, preset] of [[project.heroMedia, 'hero'], [project.thumbnail, 'card']]) {
    const image = getImageProps(asset, { preset, sizes: '100vw' });
    assert.match(image.src, /cdn-cgi\/image/);
    assert.ok(image.srcset.endsWith(preset === 'card' ? '1024w' : '1800w'));
    assert.ok(image.srcset.split(', ').every(candidate => candidate.includes('quality=90,format=auto/')));
  }
  assert.equal(fromPayloadProject({ ...doc, heroMedia: 1, thumbnail: null }, base).heroMedia, undefined);
});

test('Projects paginate published content and preserve valid empty collections', async () => {
  let calls = 0;
  const result = await fetchPayloadProjects(base, async url => {
    calls++;
    assert.equal(url.pathname, '/api/curated-projects');
    assert.equal(url.searchParams.get('depth'), '1');
    assert.equal(url.searchParams.get('where[_status][equals]'), 'published');
    return { ok: true, json: async () => ({ docs: calls === 1 ? [doc] : [{ ...doc, slug: 'draft', _status: 'draft' }], hasNextPage: calls === 1, nextPage: 2 }) };
  });
  assert.equal(calls, 2);
  assert.equal(result.length, 1);
  assert.deepEqual(await fetchPayloadProjects(base, async () => ({ ok: true, json: async () => ({ docs: [] }) })), []);
});

test('Project fetch rejects outages, malformed records and looping pagination', async () => {
  await assert.rejects(fetchPayloadProjects(base, async () => ({ ok: false, status: 503 })), /503/);
  for (const data of [{ docs: null }, { docs: [doc, doc] }, { docs: [{ ...doc, title: '' }] }, { docs: [], hasNextPage: true, nextPage: 1 }]) {
    await assert.rejects(fetchPayloadProjects(base, async () => ({ ok: true, json: async () => data })), /invalid/i);
  }
});
