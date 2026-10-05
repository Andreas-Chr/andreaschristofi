import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { initMediaLoading } from '../src/scripts/media-loading.ts';

function setup({ eager = true, cached = false } = {}) {
  const window = new Window({ settings: { disableCSSFileLoading:true, disableJavaScriptFileLoading:true } });
  globalThis.document = window.document;
  let observer;
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {} unobserve() {} disconnect() { this.disconnected = true; }
  };
  document.body.innerHTML = '<div data-media-loading><img><span class="media-error" hidden>Image unavailable</span></div>';
  const container = document.querySelector('div');
  const image = document.querySelector('img');
  image.loading = eager ? 'eager' : 'lazy';
  let complete = cached;
  let naturalWidth = cached ? 1600 : 0;
  Object.defineProperties(image, { complete:{get:()=>complete}, naturalWidth:{get:()=>naturalWidth} });
  image.decode = async () => {};
  const dispose = initMediaLoading(document.body, document.body);
  return { container, image, dispose, observer, window,
    load() { complete = true; naturalWidth = 1600; image.dispatchEvent(new window.Event('load')); },
    fail() { complete = true; naturalWidth = 0; image.dispatchEvent(new window.Event('error')); }
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('slow images show shimmer at 100ms and reveal only after decode', async t => {
  t.mock.timers.enable({ apis:['setTimeout'] });
  const f = setup();
  t.mock.timers.tick(99);
  assert.equal(f.container.dataset.mediaState, 'pending');
  t.mock.timers.tick(1);
  assert.equal(f.container.dataset.mediaState, 'loading');
  let decoded;
  f.image.decode = () => new Promise(resolve => { decoded = resolve; });
  f.load();
  assert.equal(f.container.dataset.mediaState, 'loading');
  decoded(); await tick();
  assert.equal(f.container.dataset.mediaState, 'revealed');
  assert.equal(f.container.hasAttribute('aria-busy'), false);
  f.dispose();
});

test('cached and fast images bypass the shimmer and fade', async t => {
  t.mock.timers.enable({ apis:['setTimeout'] });
  for (const cached of [false,true]) {
    const f = setup({cached});
    if (!cached) f.load();
    await tick(); t.mock.timers.tick(150);
    assert.equal(f.container.dataset.mediaState, 'ready');
    f.dispose();
  }
});

test('offscreen media stays lazy and starts its delay on intersection', t => {
  t.mock.timers.enable({ apis:['setTimeout'] });
  const f = setup({eager:false});
  t.mock.timers.tick(500);
  assert.equal(f.container.dataset.mediaState, 'pending');
  assert.equal(f.image.loading, 'lazy');
  f.observer.callback([{target:f.container,isIntersecting:true}]);
  t.mock.timers.tick(100);
  assert.equal(f.container.dataset.mediaState, 'loading');
  f.dispose();
});

test('disposal cancels pending timers and stale decode completions', async t => {
  t.mock.timers.enable({ apis:['setTimeout'] });
  const f = setup();
  let decoded;
  f.image.decode = () => new Promise(resolve => { decoded = resolve; });
  f.load(); f.dispose(); decoded(); await tick();
  t.mock.timers.tick(500);
  assert.equal(f.container.dataset.mediaState, 'pending');
  assert.equal(f.observer.disconnected, true);
});

test('recovery remains pending until final failure exposes an error', async () => {
  const f = setup();
  f.image.setAttribute('data-responsive-image', '');
  f.image.dataset.imageRecoveryStage = '1';
  f.fail(); await tick();
  assert.equal(f.container.dataset.mediaState, 'pending');
  f.image.dataset.imageRecoveryStage = '2';
  f.fail(); await tick();
  assert.equal(f.container.dataset.mediaState, 'error');
  assert.equal(f.container.querySelector('.media-error').hidden, false);
  f.dispose();
});
