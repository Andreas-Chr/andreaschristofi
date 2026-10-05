import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { normalizePayloadMedia, mediaURL } from '../src/lib/media-assets.ts';
import { getImageProps, getOriginalImageURL } from '../src/lib/image-delivery.ts';
import { fromPayload } from '../src/lib/payload-curated-shots.ts';
import { initResponsiveImages } from '../src/scripts/responsive-images.ts';

const upload = {
  id: 7, url: '/api/media/file/screen.png', alt: 'Product screen', filename: 'screen.png',
  mimeType: 'image/png', filesize: 172408, width: 1600, height: 1200,
  updatedAt: '2026-09-28T17:54:51.221Z',
};
const base = 'https://cms.andreaschristofi.com';
const asset = normalizePayloadMedia(upload, base);
const options = { preset: 'card', sizes: '(min-width: 644px) 50vw, 100vw' };

test('upload normalization preserves metadata without changing source records', () => {
  const original = structuredClone(upload);
  assert.deepEqual(asset, { ...upload, url: `${base}${upload.url}` });
  assert.deepEqual(upload, original);
  assert.equal(normalizePayloadMedia({ ...upload, alt: null }, base).alt, '');
  for (const value of [null, undefined, 7, '7', {}, { url: 'javascript:alert(1)' }, { url: '//evil.test/file.png' }]) {
    assert.equal(normalizePayloadMedia(value, base), undefined);
  }
  const invalid = normalizePayloadMedia({ ...upload, width: -1, height: 0, updatedAt: 'invalid' }, base);
  assert.equal(invalid.width, undefined);
  assert.equal(invalid.height, undefined);
  assert.equal(invalid.updatedAt, undefined);
});

test('adapter retains legacy URLs alongside shared detail and poster metadata', () => {
  const doc = { slug: 'screen', order: 1, thumbnail: upload, media: [
    { type: 'video', file: { ...upload, url: '/api/media/file/movie.mp4', mimeType: 'video/mp4' }, posterImage: upload },
  ] };
  const result = fromPayload(doc, base);
  assert.deepEqual(result.thumbnail, asset);
  assert.equal(result.media[0].src, `${base}/api/media/file/movie.mp4`);
  assert.equal(result.media[0].asset.mimeType, 'video/mp4');
  assert.equal(result.media[0].poster, asset.url);
  assert.deepEqual(result.media[0].posterAsset, asset);
});

test('responsive URLs preserve proportions and revision both source and derivative cache keys', () => {
  const result = getImageProps(asset, options);
  assert.match(result.src, /width=800,fit=scale-down,quality=90,format=auto\//);
  assert.ok(result.srcset.split(', ').every(candidate => candidate.includes('quality=90,format=auto/')));
  assert.match(result.src, /screen\.png\?v=2026-09-28T17%3A54%3A51\.221Z$/);
  assert.match(result.srcset, / 320w, .* 480w, .* 640w, .* 800w, .* 1024w$/);
  assert.equal(result.sizes, options.sizes);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1200);
  assert.equal(result.alt, upload.alt);
  assert.equal(result.loading, 'lazy');
  assert.equal(result.decoding, 'async');
  assert.doesNotMatch(result.src, /height=|dpr=|anim=false/);
  assert.notEqual(result.src, getImageProps({ ...asset, updatedAt: '2026-10-02T12:00:00Z' }, options).src);
});

test('content caps large sources at 1600 and transforms even intrinsic-width candidates', () => {
  const result = getImageProps(asset, { preset: 'content', sizes: '992px', preserveResolution: true });
  assert.match(result.src, /width=1600,fit=scale-down,quality=90,format=auto\//);
  const responsive = getImageProps(asset, { preset: 'content', sizes: '374px' });
  assert.ok(responsive.srcset.endsWith(`${result.src} 1600w`));
  assert.equal(result.srcset, `${result.src} 1600w`);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1200);
  assert.equal(getImageProps(asset, { preset: 'content', sizes: '992px', preserveResolution: true, enabled: false }).src, getOriginalImageURL(asset));
  const large = { ...asset, width: 4000, height: 3000 };
  for (const [preset, expected] of [['card', [320, 480, 640, 800, 1024]], ['content', [480, 640, 800, 1024, 1200, 1440, 1600]]]) {
    const props = getImageProps(large, { ...options, preset });
    const candidates = props.srcset.split(', ');
    assert.deepEqual(candidates.map(candidate => Number(candidate.match(/ (\d+)w$/)[1])), expected);
    assert.ok(candidates.every(candidate => candidate.startsWith('https://andreaschristofi.com/cdn-cgi/image/')));
    assert.match(getImageProps(large, { ...options, preset, preserveResolution: true }).src, new RegExp(`width=${expected.at(-1)},`));
  }
});

test('JPEG and PNG candidates negotiate format at quality 90', () => {
  for (const mimeType of ['image/jpeg', 'image/png']) {
    const input = { ...asset, mimeType, url: `${base}/api/media/file/screen.${mimeType === 'image/jpeg' ? 'jpg' : 'png'}` };
    const result = getImageProps(input, options);
    assert.match(result.src, /width=800,fit=scale-down,quality=90,format=auto\//);
    assert.ok(result.srcset.split(', ').every(candidate => candidate.includes('quality=90,format=auto/')));
    assert.doesNotMatch(result.srcset, /format=jpeg|quality=100/);
  }
});

test('small masters never produce overstated width descriptors or duplicate variants', () => {
  for (const width of [200, 320, 500, 800, 1024]) {
    const result = getImageProps({ ...asset, width, height: 375 }, options);
    const candidates = result.srcset.split(', ');
    const widths = candidates.map(candidate => Number(candidate.match(/ (\d+)w$/)[1]));
    assert.equal(new Set(widths).size, widths.length);
    assert.ok(widths.every(value => value <= width));
    assert.equal(widths.at(-1), width);
    assert.match(result.src, new RegExp(`width=${Math.min(800, width)},`));
    assert.ok(candidates.every(candidate => candidate.startsWith('https://andreaschristofi.com/cdn-cgi/image/')));
  }
});

test('GIFs, SVGs, videos, unknown MIME, local sources and nested transforms pass through', () => {
  const sources = [
    { mimeType: 'image/webp' }, { mimeType: 'image/avif' },
    { mimeType: 'image/gif' }, { mimeType: 'image/svg+xml' }, { mimeType: 'video/mp4' }, { mimeType: undefined },
    { url: 'http://localhost:8787/api/media/file/screen.png' },
    { url: 'http://127.0.0.1:8787/api/media/file/screen.png' },
    { url: '/assets/screen.png' }, { url: 'https://example.com/screen.png' },
    { url: `${base}/api/media/file/screen.gif` }, { url: `${base}/other/screen.png` },
    { url: 'https://andreaschristofi.com/cdn-cgi/image/width=800/source.png' },
  ];
  for (const overrides of sources) {
    const input = { ...asset, ...overrides };
    const result = getImageProps(input, options);
    assert.equal(result.src, getOriginalImageURL(input));
    assert.equal(result.srcset, undefined);
    assert.equal(result.sizes, undefined);
  }
});

test('missing dimensions bypass responsive delivery; the kill switch and priority remain explicit', () => {
  for (const dims of [{ width: undefined }, { height: undefined }, { width: NaN }, { height: -1 }]) {
    const result = getImageProps({ ...asset, ...dims }, options);
    assert.equal(result.src, getOriginalImageURL(asset));
    assert.equal(result.srcset, undefined);
    assert.equal(result.width, undefined);
    assert.equal(result.height, undefined);
  }
  assert.equal(getImageProps(asset, { ...options, enabled: false }).src, getOriginalImageURL(asset));
  const priority = getImageProps(asset, { ...options, priority: true });
  assert.equal(priority.loading, 'eager');
  assert.equal(priority.fetchpriority, 'high');
  assert.equal(priority.decoding, 'async');
  const normal = getImageProps(asset, options);
  assert.equal(normal.fetchpriority, undefined);
  const { loading, fetchpriority, ...priorityDelivery } = priority;
  const { loading: normalLoading, ...normalDelivery } = normal;
  assert.deepEqual(priorityDelivery, normalDelivery);
  assert.throws(() => getImageProps(asset, { ...options, sizes: '' }), /sizes/);
});

test('unsafe sources cannot be rendered or sent to transformations', () => {
  for (const url of ['javascript:alert(1)', '//evil.test/file.png', 'http://example.com/file.png',
    'https://user:password@cms.andreaschristofi.com/api/media/file/screen.png', '/bad\\path.png']) {
    assert.equal(mediaURL(url), undefined);
    assert.throws(() => getImageProps({ ...asset, url }, options), /safe media URL/);
  }
});

test('all delivery presets bound their variants and require no content-specific model', () => {
  for (const preset of ['card', 'content', 'hero', 'gallery', 'poster']) {
    const result = getImageProps(asset, { ...options, preset });
    assert.ok(result.srcset.split(', ').length <= 9);
    assert.ok(result.srcset.split(', ').every(candidate => Number(candidate.match(/ (\d+)w$/)[1]) <= asset.width));
    assert.equal(result.loading, 'lazy');
    assert.equal(result.decoding, 'async');
    assert.equal(result.fetchpriority, undefined);
  }
});

test('delegated recovery covers newly mounted modal images and stops after the placeholder', () => {
  const window = new Window({ url: 'https://andreaschristofi.com', settings: { enableImageFileLoading: false } });
  globalThis.document = window.document;
  for (const name of ['HTMLImageElement', 'HTMLVideoElement', 'Element', 'MutationObserver', 'Image']) globalThis[name] = window[name];
  try {
    initResponsiveImages();
    initResponsiveImages(); // Multiple component instances must not duplicate retries.
    const image = document.createElement('img');
    image.setAttribute('data-responsive-image', '');
    image.dataset.imageOriginal = '/original.png';
    image.dataset.responsiveImageFallback = '/fallback.png';
    image.src = '/transformed.png';
    image.srcset = '/small.png 320w, /large.png 800w';
    image.sizes = '50vw';
    document.body.append(image);
    image.dispatchEvent(new window.Event('error'));
    assert.equal(image.getAttribute('src'), '/original.png');
    assert.equal(image.getAttribute('srcset'), null);
    assert.equal(image.getAttribute('sizes'), null);
    image.dispatchEvent(new window.Event('error'));
    assert.equal(image.getAttribute('src'), '/fallback.png');
    image.dispatchEvent(new window.Event('error'));
    assert.equal(image.getAttribute('src'), '/fallback.png');
    const direct = image.cloneNode();
    direct.src = '/original.png';
    delete direct.dataset.imageRecoveryStage;
    document.body.append(direct);
    direct.dispatchEvent(new window.Event('error'));
    assert.equal(direct.getAttribute('src'), '/fallback.png');
    const unrelated = document.createElement('img');
    unrelated.src = '/icon.svg';
    document.body.append(unrelated);
    unrelated.dispatchEvent(new window.Event('error'));
    assert.equal(unrelated.getAttribute('src'), '/icon.svg');
    document.dispatchEvent(new window.Event('astro:before-swap'));
    assert.equal(document.documentElement.dataset.responsiveImagesInitialized, undefined);
  } finally { window.close(); }
});


test('revisioned original remains available with missing dimensions and resizing disabled', () => {
  for (const overrides of [{ mimeType: 'image/gif', url: `${base}/api/media/file/motion.gif` }, { width: undefined }, {}]) {
    const input = { ...asset, ...overrides };
    assert.match(getImageProps(input, { ...options, enabled: false }).src, /[?&]v=/);
  }
  assert.notEqual(getOriginalImageURL(asset), getOriginalImageURL({ ...asset, updatedAt: '2026-10-03T10:00:00Z' }));
});

test('failed responsive candidate retries original even when src already names the original', () => {
  const window = new Window({ url: 'https://andreaschristofi.com', settings: { enableImageFileLoading: false } });
  globalThis.document = window.document;
  for (const name of ['HTMLImageElement', 'HTMLVideoElement', 'Element', 'MutationObserver', 'Image']) globalThis[name] = window[name];
  try {
    initResponsiveImages();
    const image = document.createElement('img');
    image.setAttribute('data-responsive-image', '');
    image.dataset.imageOriginal = '/master.png?v=2';
    image.dataset.responsiveImageFallback = '/fallback.png';
    image.src = '/master.png?v=2';
    image.srcset = '/broken.png 320w, /master.png?v=2 500w';
    document.body.append(image);
    image.dispatchEvent(new window.Event('error'));
    assert.equal(image.getAttribute('srcset'), null);
    assert.equal(image.getAttribute('src'), '/master.png?v=2');
    image.dispatchEvent(new window.Event('error'));
    assert.equal(image.getAttribute('src'), '/fallback.png');
  } finally { window.close(); }
});
