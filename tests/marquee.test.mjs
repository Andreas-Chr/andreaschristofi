import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { closestEdge, driftOffset, initMarquee, pickThumbnails, shuffle, viewProgress } from '../src/scripts/marquee.ts';

const sequence = values => { let i = 0; return () => values[i++ % values.length]; };

test('the closest edge splits the line at half its height', () => {
  assert.equal(closestEdge(0, 120), 'top');
  assert.equal(closestEdge(59.9, 120), 'top');
  assert.equal(closestEdge(60, 120), 'bottom');
  assert.equal(closestEdge(120, 120), 'bottom');
});

test('shuffle is a permutation and leaves the pool untouched', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'];
  const result = shuffle(pool, sequence([0.7, 0.1, 0.9, 0.4]));
  assert.deepEqual([...result].sort(), pool);
  assert.deepEqual(pool, ['a', 'b', 'c', 'd', 'e']);
});

test('thumbnails stay distinct while the pool lasts', () => {
  for (let run = 0; run < 50; run++) {
    const picks = pickThumbnails(3, ['a', 'b', 'c', 'd', 'e']);
    assert.equal(picks.length, 3);
    assert.equal(new Set(picks).size, 3);
  }
  assert.equal(new Set(pickThumbnails(3, ['a', 'b', 'c'])).size, 3);
});

test('more lines than shots repeat the shuffled order without matching neighbours', () => {
  for (let run = 0; run < 50; run++) {
    const picks = pickThumbnails(7, ['a', 'b', 'c']);
    assert.deepEqual(picks.slice(3), picks.slice(0, 4));
    picks.slice(1).forEach((pick, i) => assert.notEqual(pick, picks[i]));
  }
  const pair = pickThumbnails(5, ['a', 'b']);
  pair.slice(1).forEach((pick, i) => assert.notEqual(pick, pair[i]));
});

test('an empty pool or no lines pick nothing', () => {
  assert.deepEqual(pickThumbnails(3, []), []);
  assert.deepEqual(pickThumbnails(0, ['a']), []);
});

test('view progress follows the CSS cover range and clamps', () => {
  assert.equal(viewProgress(800, 120, 800), 0);
  assert.equal(viewProgress(-120, 120, 800), 1);
  assert.equal(viewProgress(340, 120, 800), 0.5);
  assert.equal(viewProgress(2000, 120, 800), 0);
  assert.equal(viewProgress(-2000, 120, 800), 1);
  assert.equal(viewProgress(0, 0, 0), 0);
});

test('odd lines drift left to right and even lines reverse', () => {
  assert.equal(driftOffset(0, false), -35);
  assert.equal(driftOffset(1, false), -15);
  assert.equal(driftOffset(0, true), -15);
  assert.equal(driftOffset(1, true), -35);
  assert.equal(driftOffset(0.5, false), driftOffset(0.5, true));
});

function setup({ hover = true, pool = [] } = {}) {
  // A base URL lets relative sources parse; happy-dom then leaves images unloaded.
  const window = new Window({ url: 'https://andreaschristofi.test/design-system/' });
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.CSS = { supports: () => true };
  globalThis.getComputedStyle = element => window.getComputedStyle(element);
  const queries = {};
  globalThis.matchMedia = query => (queries[query] ??= Object.assign(new window.EventTarget(), { matches: query === '(hover: hover)' ? hover : query === '(hover: none)' ? !hover : false }));
  const observers = [];
  globalThis.IntersectionObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } };
  const line = label => `<li class="marquee-line"><div class="marquee-default"><span>${label}</span></div><div class="marquee-overlay"><div class="marquee-overlay-inner"><div class="marquee-track"><span>${label}</span><span class="marquee-pill"><img alt=""></span><span>${label}</span><span class="marquee-pill"><img alt=""></span></div></div></div></li>`;
  document.body.innerHTML = `<div data-marquee><ul>${line('A')}${line('B')}${line('C')}</ul></div>`;
  const root = document.querySelector('[data-marquee]');
  root.dataset.marqueePool = JSON.stringify(pool);
  initMarquee(root);
  return { window, root, observers, queries };
}
const shots = ['one', 'two', 'three', 'four'].map(name => ({ src: `/t/${name}.jpg`, srcset: `/t/${name}.jpg 320w`, sizes: '160px', original: `/o/${name}.jpg` }));

test('thumbnails load near the viewport, one distinct image per line', () => {
  const { root, observers } = setup({ pool: shots });
  const images = [...root.querySelectorAll('img')];
  assert.ok(images.every(image => !image.getAttribute('src')));
  observers[0].callback([{ isIntersecting: true }]);
  assert.ok(observers[0].disconnected);
  const lines = [...root.querySelectorAll('.marquee-line')].map(line => [...line.querySelectorAll('img')].map(image => image.getAttribute('src')));
  lines.forEach(sources => assert.equal(new Set(sources).size, 1));
  assert.equal(new Set(lines.map(sources => sources[0])).size, 3);
  assert.equal(images[0].getAttribute('sizes'), '160px');
});

test('a failed thumbnail retries the original once, then leaves the grey Pill', () => {
  const { window, root, observers } = setup({ pool: shots.slice(0, 1) });
  observers[0].callback([{ isIntersecting: true }]);
  const image = root.querySelector('img');
  image.dispatchEvent(new window.Event('error'));
  assert.equal(image.getAttribute('src'), '/o/one.jpg');
  assert.equal(image.hasAttribute('srcset'), false);
  image.dispatchEvent(new window.Event('error'));
  assert.equal(image.getAttribute('src'), '/o/one.jpg');
  assert.equal(image.dataset.loaded, undefined);
  image.dispatchEvent(new window.Event('load'));
  assert.equal(image.dataset.loaded, 'true');
});

test('touch-only devices and empty pools load no thumbnails', () => {
  const touch = setup({ hover: false, pool: shots });
  assert.equal(touch.observers.length, 0);
  assert.equal(touch.root.dataset.ready, 'true');
  const empty = setup({ pool: [] });
  empty.observers[0].callback([{ isIntersecting: true }]);
  assert.ok([...empty.root.querySelectorAll('img')].every(image => !image.getAttribute('src')));
});
