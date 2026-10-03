import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Window } from 'happy-dom';
import { embedURL, mediaURL, shotMedia, validateShots, shotTitle, shotParagraphs, shotRichTextHTML } from '../src/lib/curated-shots.ts';
import { fromPayload, fetchPayloadShots } from '../src/lib/payload-curated-shots.ts';
import { initCuratedShots } from '../src/scripts/curated-shots.ts';

test('shots use one layout and omit blank content without losing populated media', () => {
  const dir = new URL('../src/content/curated-shots/', import.meta.url);
  const entries = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL(f, dir))));
  assert.equal(validateShots(entries).length, 8);
  assert.ok(entries.every(e => shotMedia(e).length === 0));
  assert.equal(shotTitle({ title: ' ', slug: 'shot-01' }), 'shot 01');
  assert.deepEqual(shotParagraphs('   '), []);
  assert.deepEqual(shotParagraphs('First paragraph.\n\nSecond paragraph.'), ['First paragraph.', 'Second paragraph.']);
  assert.equal(shotMedia({ media: [{ type: 'image', src: '/first.jpg' }, { type: 'image', src: '' }, { type: 'image', src: '/second.jpg' }] }).length, 2);
  assert.equal(shotMedia({ media: null }).length, 0);
  assert.equal(shotMedia({ media: [{ type: 'gif', src: '/animated.gif' }] }).length, 1);
  assert.throws(() => validateShots([entries[0], entries[0]]), /duplicate/);
});

test('rich text renders formatting and safe links without accepting HTML from content', () => {
  const value = { root: { type: 'root', children: [{ type: 'paragraph', children: [
    { type: 'text', text: 'Hello <world>', format: 1 },
    { type: 'link', fields: { url: 'javascript:alert(1)' }, children: [{ type: 'text', text: ' unsafe', format: 0 }] },
    { type: 'link', fields: { url: 'https://example.com', newTab: true }, children: [{ type: 'text', text: ' safe', format: 0 }] },
  ] }] } };
  assert.match(shotRichTextHTML(value), /<strong>Hello &lt;world&gt;<\/strong>/);
  assert.doesNotMatch(shotRichTextHTML(value), /javascript:/);
  assert.match(shotRichTextHTML(value), /rel="noopener noreferrer"/);
  assert.equal(shotRichTextHTML('One\n\nTwo'), '<p>One</p><p>Two</p>');
});

test('video URLs allow YouTube and reject unsafe inputs', () => {
  assert.match(embedURL('youtube', 'https://youtu.be/dQw4w9WgXcQ'), /youtube-nocookie.com\/embed\/dQw4w9WgXcQ\?autoplay=1&mute=1/);
  assert.match(embedURL('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'), /playsinline=1/);
  assert.equal(embedURL('gif', 'https://example.com/animated.gif'), undefined);
  assert.equal(embedURL('youtube', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ'), undefined);
  assert.equal(mediaURL('javascript:alert(1)'), undefined);
  assert.equal(mediaURL('//evil.test/image'), undefined);
  assert.equal(mediaURL('/assets/curated-shots/art.webp'), '/assets/curated-shots/art.webp');
  assert.equal(mediaURL('http://localhost:3000/api/media/file/test.jpg'), 'http://localhost:3000/api/media/file/test.jpg');
  assert.equal(mediaURL('http://example.com/test.jpg'), undefined);
});

test('Payload adapter maps uploads and excludes drafts, paginates, and fails on outages', async () => {
  const doc = { slug:'art', order:1, _status:'published', thumbnail:{url:'/media/cover.webp',alt:'Cover'}, media:[{type:'video',file:{url:'/media/movie.webm'},posterImage:{url:'/media/poster.webp'}}] };
  const mapped = fromPayload(doc, 'https://cms.example.com');
  assert.deepEqual(mapped.thumbnail, { url: 'https://cms.example.com/media/cover.webp', alt: 'Cover' });
  assert.equal(mapped.media[0].src, 'https://cms.example.com/media/movie.webm');
  let count = 0;
  const result = await fetchPayloadShots('https://cms.example.com', async url => {
    count++;
    assert.equal(url.searchParams.get('depth'), '1');
    assert.equal(url.searchParams.get('page'), String(count));
    return { ok:true, json:async () => ({docs:[count === 1 ? doc : {...doc,slug:'draft',_status:'draft'}],hasNextPage:count === 1,nextPage:2}) };
  });
  assert.equal(count,2);
  assert.equal(result.length,1);
  await assert.rejects(fetchPayloadShots('https://cms.example.com', async () => ({ok:false,status:503})), /503/);
});

function addMediaFixture(template, markup) {
  const media = document.createElement('div');
  media.className = 'shot-media';
  media.setAttribute('data-shot-media', '');
  media.innerHTML = markup;
  template.content.querySelector('.shot-body').append(media);
}

function fixture() {
  const window = new Window({url:'https://andreaschristofi.com',settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableIframePageLoading:true}});
  window.document.write(readFileSync(new URL('../dist/index.html', import.meta.url),'utf8'));
  for (const name of ['document','Element','HTMLElement','HTMLImageElement','HTMLVideoElement','HTMLIFrameElement']) globalThis[name] = name === 'document' ? window.document : window[name];
  globalThis.matchMedia = () => ({ matches:false });
  const observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback, options) { this.callback=callback; this.options=options; this.elements=[]; observers.push(this); }
    observe(element) { this.elements.push(element); }
    disconnect() { this.disconnected=true; }
  };
  const dialog = document.querySelector('[data-shot-dialog]');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new window.Event('close')); };
  // Preserve build-time URLs before the DOM shim's unloaded images trigger fallbacks.
  const cardThumbnails = new Map([...document.querySelectorAll('.curated-grid button')].map(card => [card.dataset.shotOpen, card.querySelector('.curated-card-thumbnail').getAttribute('src')]));
  initCuratedShots();
  return {window,dialog,observers,cardThumbnails};
}

test('homepage cards open their own content; related navigation retains original focus return', () => {
  const {window,dialog,cardThumbnails} = fixture();
  try {
    const cards = [...document.querySelectorAll('.curated-grid button')];
    const templates = [...document.querySelectorAll('[data-shot-template]')];
    assert.ok(cards.length > 0);
    assert.deepEqual(cards.map(card => card.dataset.shotOpen), templates.map(template => template.dataset.shotTemplate));
    assert.equal(document.querySelectorAll('[data-shot-dialog]').length,1);
    assert.equal(document.querySelector('[data-shot-content]').children.length,0);
    for (const card of cards) {
      const template = templates.find(template => template.dataset.shotTemplate === card.dataset.shotOpen);
      const expectedMediaCount = template.content.querySelectorAll('.shot-media').length;
      assert.equal(card.querySelector('.curated-card-title').textContent.trim(), template.content.querySelector('h2').textContent.trim());
      const relatedCards = [...template.content.querySelectorAll('.shot-related-grid button')];
      assert.equal(relatedCards.length, Math.min(2, cards.length - 1));
      for (const relatedCard of relatedCards) {
        assert.notEqual(relatedCard.dataset.shotOpen, card.dataset.shotOpen);
        const matchingCard = cards.find(other => other.dataset.shotOpen === relatedCard.dataset.shotOpen);
        assert.ok(matchingCard);
        assert.equal(relatedCard.querySelector('.curated-card-title').textContent, matchingCard.querySelector('.curated-card-title').textContent);
        assert.equal(relatedCard.querySelector('.curated-card-thumbnail').getAttribute('src'), cardThumbnails.get(relatedCard.dataset.shotOpen));
      }
      card.click();
      assert.equal(dialog.open,true);
      assert.equal(dialog.querySelector('article').dataset.shot,card.dataset.shotOpen);
      assert.equal(dialog.querySelectorAll('.shot-media').length,expectedMediaCount);
      assert.equal(document.documentElement.style.overflow,'hidden');
      assert.equal(document.activeElement.id,'active-shot-title');
      const panel = dialog.querySelector('[data-shot-scroll]');
      panel.scrollTop = 500;
      dialog.querySelector('[data-shot-open]').click();
      assert.notEqual(dialog.querySelector('article').dataset.shot,card.dataset.shotOpen);
      assert.equal(panel.scrollTop,0);
      dialog.querySelector('[data-shot-close]').click();
      assert.equal(document.activeElement,card);
      assert.equal(document.documentElement.style.overflow,'');
      assert.equal(dialog.querySelector('article'),null);
    }
  } finally { window.close(); }
});

test('touch dismissal restores the original card without a lingering visual focus state', () => {
  const { window, dialog } = fixture();
  try {
    const card = document.querySelector('.curated-grid button');
    card.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    card.click();
    dialog.querySelector('[data-shot-open]').click();
    const close = dialog.querySelector('[data-shot-close]');
    close.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    close.click();
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, card);
    assert.equal(card.hasAttribute('data-shot-pointer-focus'), true);
    card.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    assert.equal(card.hasAttribute('data-shot-pointer-focus'), false, 'keyboard interaction restores visible focus');

    card.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    card.click();
    dialog.close();
    assert.equal(card.hasAttribute('data-shot-pointer-focus'), true);
    document.querySelector('.curated-grid button:nth-child(2)').focus();
    assert.equal(card.hasAttribute('data-shot-pointer-focus'), false, 'suppression ends when focus leaves the card');
  } finally { window.close(); }
});

test('keyboard dismissal keeps the restored card focus visible even after touch opening', () => {
  const { window, dialog } = fixture();
  try {
    const card = document.querySelector('.curated-grid button');
    card.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    card.click();
    dialog.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    dialog.dispatchEvent(new window.Event('cancel', { cancelable: true }));
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, card);
    assert.equal(card.hasAttribute('data-shot-pointer-focus'), false);
  } finally { window.close(); }
});

test('media activation is deferred, muted and stopped on close; image errors use fallback', async () => {
  const {window,dialog,observers} = fixture();
  try {
    const template = document.querySelector('[data-shot-template]');
    addMediaFixture(template, '<video data-shot-video data-src="/test.webm"></video><iframe data-shot-embed data-src="https://player.vimeo.com/video/123?autoplay=1"></iframe><img data-image-fallback="/fallback.png" src="/test.jpg">');
    document.querySelector('.curated-grid button').click();
    const video=dialog.querySelector('video'), iframe=dialog.querySelector('iframe');
    assert.equal(observers.at(-1).options.root,dialog.querySelector('[data-shot-scroll]'));
    assert.equal(video.getAttribute('src'),null);
    assert.equal(iframe.getAttribute('src'),null);
    let played=0,paused=0;
    video.play=async()=>{played++;};video.pause=()=>{paused++;};video.load=()=>{};
    observers.at(-1).callback([{target:video,isIntersecting:true},{target:iframe,isIntersecting:true}]);
    assert.equal(played,1);assert.equal(video.muted,true);
    assert.match(iframe.src,/autoplay=1/);
    const img=dialog.querySelector('img[data-image-fallback]');
    img.src='/missing.webp';img.dispatchEvent(new window.Event('error'));
    assert.equal(img.getAttribute('src'),img.dataset.imageFallback);
    dialog.close();
    assert.equal(paused,1);
    assert.equal(video.getAttribute('src'),null);
    assert.equal(iframe.getAttribute('src'),null);
  } finally { window.close(); }
});

test('reduced motion leaves autoplay off but makes player controls available', () => {
  const {window,dialog,observers} = fixture();
  try {
    globalThis.matchMedia = () => ({matches:true});
    addMediaFixture(document.querySelector('[data-shot-template]'), '<video data-shot-video data-src="/test.mp4" controls></video><iframe data-shot-embed data-src="https://player.vimeo.com/video/123?autoplay=1"></iframe>');
    document.querySelector('.curated-grid button').click();
    const video=dialog.querySelector('video'), iframe=dialog.querySelector('iframe');
    video.play=()=>{assert.fail('Reduced motion must not autoplay');};
    observers.at(-1).callback([{target:video,isIntersecting:true},{target:iframe,isIntersecting:true}]);
    assert.equal(video.controls,true);
    assert.equal(video.getAttribute('src'),'/test.mp4');
    assert.match(iframe.src,/autoplay=0/);
  } finally { window.close(); }
});

test('only a complete backdrop click closes the modal; internal clicks do not', () => {
  const {window,dialog} = fixture();
  try {
    document.querySelector('.curated-grid button').click();
    dialog.getBoundingClientRect=()=>({left:0,right:1440,top:50,bottom:900});
    const panel = dialog.querySelector('[data-shot-scroll]');
    panel.dispatchEvent(new window.PointerEvent('pointerdown',{clientX:100,clientY:100,bubbles:true}));
    panel.dispatchEvent(new window.MouseEvent('click',{clientX:100,clientY:100,bubbles:true}));
    assert.equal(dialog.open,true);
    dialog.dispatchEvent(new window.PointerEvent('pointerdown',{clientX:100,clientY:20,bubbles:true}));
    dialog.dispatchEvent(new window.MouseEvent('click',{clientX:100,clientY:20,bubbles:true}));
    assert.equal(dialog.open,false);
  } finally { window.close(); }
});

test('transparent close-bar space dismisses only a complete click, leaving panel interactions open', () => {
  const { window, dialog } = fixture();
  try {
    document.querySelector('.curated-grid button').click();
    dialog.getBoundingClientRect = () => ({ left:0, right:1440, top:50, bottom:900 });
    const bar = dialog.querySelector('.shot-close-bar');
    const panel = dialog.querySelector('[data-shot-scroll]');
    const pointer = (element, type) => element.dispatchEvent(new window.PointerEvent(type, { clientX:100, clientY:60, bubbles:true }));
    pointer(panel, 'pointerdown');
    pointer(bar, 'click');
    assert.equal(dialog.open, true);
    pointer(bar, 'pointerdown');
    pointer(panel, 'click');
    assert.equal(dialog.open, true);
    pointer(bar, 'pointerdown');
    pointer(bar, 'click');
    assert.equal(dialog.open, false);
  } finally { window.close(); }
});

function pendingExit(dialog) {
  let finish, cancel;
  const finished = new Promise((resolve, reject) => { finish = resolve; cancel = reject; });
  let reads = 0;
  dialog.getAnimations = () => { reads++; return [{ finished }]; };
  return { finish, cancel, get reads() { return reads; } };
}

test('animated dismissal retains content and scroll lock until exit, then restores original focus', async () => {
  const { window, dialog } = fixture();
  try {
    document.documentElement.style.overflow = 'clip';
    document.body.style.overflow = 'auto';
    const card = document.querySelector('.curated-grid button');
    card.click();
    dialog.querySelector('[data-shot-open]').click();
    const article = dialog.querySelector('article');
    const exit = pendingExit(dialog);
    dialog.querySelector('[data-shot-close]').click();
    dialog.querySelector('[data-shot-close]').click();
    dialog.querySelector('[data-shot-open]').click();
    assert.equal(exit.reads, 1, 'repeated close requests do not restart the exit');
    assert.equal(dialog.dataset.motion, 'closing');
    assert.equal(dialog.open, true);
    assert.equal(dialog.querySelector('article'), article, 'related navigation cannot replace closing content');
    assert.equal(document.documentElement.style.overflow, 'hidden');
    assert.ok(dialog.contains(document.activeElement));
    exit.finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(dialog.open, false);
    assert.equal(dialog.querySelector('article'), null);
    assert.equal(dialog.dataset.motion, undefined);
    assert.equal(document.documentElement.style.overflow, 'clip');
    assert.equal(document.body.style.overflow, 'auto');
    assert.equal(document.activeElement, card);
  } finally { window.close(); }
});

test('Escape and backdrop dismissal both wait for exit; cancelled motion still closes', async () => {
  const { window, dialog } = fixture();
  try {
    const card = document.querySelector('.curated-grid button');
    for (const trigger of ['escape', 'backdrop']) {
      card.click();
      const exit = pendingExit(dialog);
      if (trigger === 'escape') {
        const event = new window.Event('cancel', { cancelable: true });
        dialog.dispatchEvent(event);
        assert.equal(event.defaultPrevented, true, 'native Escape must wait for the exit');
      } else {
        dialog.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }));
        dialog.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      }
      assert.equal(dialog.open, true);
      assert.equal(dialog.dataset.motion, 'closing');
      exit.cancel(new Error('motion preference changed'));
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(dialog.open, false);
      assert.equal(document.activeElement, card);
    }
  } finally { window.close(); }
});

test('reduced motion dismisses immediately without waiting for animation', () => {
  const { window, dialog } = fixture();
  try {
    globalThis.matchMedia = () => ({ matches: true });
    const card = document.querySelector('.curated-grid button');
    card.click();
    const exit = pendingExit(dialog);
    dialog.querySelector('[data-shot-close]').click();
    assert.equal(exit.reads, 0);
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, card);
    assert.equal(document.documentElement.style.overflow, '');
  } finally { window.close(); }
});

test('an old exit cannot close a newly reopened modal; page swap cleans up immediately', async () => {
  const { window, dialog } = fixture();
  try {
    const card = document.querySelector('.curated-grid button');
    card.click();
    const oldExit = pendingExit(dialog);
    dialog.querySelector('[data-shot-close]').click();
    dialog.close();
    card.click();
    const newExit = pendingExit(dialog);
    dialog.querySelector('[data-shot-close]').click();
    oldExit.finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(dialog.open, true, 'only the current exit can finish dismissal');
    document.dispatchEvent(new window.Event('astro:before-swap'));
    assert.equal(dialog.open, false);
    assert.equal(document.documentElement.style.overflow, '');
    assert.equal(dialog.querySelector('article'), null);
    newExit.finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(dialog.open, false);
  } finally { window.close(); }
});


test('thumbnail alt comes only from Media, with safe empty and unresolved relationships', () => {
  const doc = { slug: 'alt-check', order: 1, thumbnailAlt: 'Legacy override', media: [] };
  const base = 'https://cms.example.com';
  assert.equal(fromPayload({ ...doc, thumbnail: { url: '/cover.webp', alt: 'Media description' } }, base).thumbnail.alt, 'Media description');
  for (const alt of ['', null, undefined]) {
    assert.equal(fromPayload({ ...doc, thumbnail: { url: '/cover.webp', alt } }, base).thumbnail.alt, '');
  }
  for (const thumbnail of [null, undefined, 42, '42']) {
    assert.deepEqual(fromPayload({ ...doc, thumbnail }, base).thumbnail, { url: undefined, alt: '' });
  }
});


test('all shot media use asset alt only and ignore legacy block overrides', () => {
  const map = (item) => fromPayload({ slug: 'asset-alt', order: 1, media: [item] }, 'https://cms.example.com').media[0];
  for (const type of ['image', 'gif', 'video']) {
    assert.equal(map({ type, alt: 'Old override', file: { url: '/asset', alt: 'Asset description' } }).alt, 'Asset description');
    for (const alt of ['', null, undefined]) {
      assert.equal(map({ type, alt: 'Old override', file: { url: '/asset', alt } }).alt, '');
    }
    for (const file of [null, undefined, 42, '42']) {
      assert.equal(map({ type, alt: 'Old override', file }).alt, '');
    }
  }
  assert.equal(map({ type: 'youtube', src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'Old override' }).alt, '');
});


test('description links remain anchors after modal mounting and clicks are not intercepted', () => {
  const { window, dialog } = fixture();
  try {
    const description = { root: { type: 'root', children: [{ type: 'paragraph', children: [
      { type: 'link', fields: { url: 'http://decol24.com/', newTab: true }, children: [{ type: 'text', text: 'decol24.com' }] },
    ] }] } };
    const block = document.createElement('div');
    block.className = 'shot-rich-text';
    block.innerHTML = shotRichTextHTML(description);
    document.querySelector('[data-shot-template]').content.querySelector('.shot-body').append(block);
    document.querySelector('.curated-grid button').click();
    const link = dialog.querySelector('.shot-rich-text a');
    assert.equal(link.getAttribute('href'), 'http://decol24.com/');
    assert.equal(link.target, '_blank');
    let reachedDocument = false;
    document.addEventListener('click', event => {
      assert.equal(event.defaultPrevented, false);
      reachedDocument = true;
      event.preventDefault(); // Avoid external navigation from the test environment.
    }, { once: true });
    link.click();
    assert.equal(reachedDocument, true);
    assert.equal(dialog.open, true);
    assert.equal(link.isConnected, true);
  } finally { window.close(); }
});
