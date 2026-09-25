import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Window } from 'happy-dom';
import { embedURL, mediaURL, shotMedia, validateShots, shotTitle, shotParagraphs } from '../src/lib/curated-shots.ts';
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
  assert.throws(() => validateShots([entries[0], entries[0]]), /duplicate/);
});

test('video URLs allow supported providers, preserve private Vimeo hashes and reject unsafe inputs', () => {
  assert.match(embedURL('youtube', 'https://youtu.be/dQw4w9WgXcQ'), /youtube-nocookie.com\/embed\/dQw4w9WgXcQ\?autoplay=1&mute=1/);
  assert.match(embedURL('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'), /playsinline=1/);
  assert.match(embedURL('vimeo', 'https://vimeo.com/12345678/abcdef'), /h=abcdef&autoplay=1&muted=1/);
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
  assert.equal(mapped.thumbnail, 'https://cms.example.com/media/cover.webp');
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
    constructor(callback) { this.callback=callback; this.elements=[]; observers.push(this); }
    observe(element) { this.elements.push(element); }
    disconnect() { this.disconnected=true; }
  };
  const dialog = document.querySelector('[data-shot-dialog]');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new window.Event('close')); };
  initCuratedShots();
  return {window,dialog,observers};
}

test('homepage cards open their own content; related navigation retains original focus return', () => {
  const {window,dialog} = fixture();
  try {
    const cards = [...document.querySelectorAll('.curated-grid button')];
    assert.equal(cards.length,8);
    assert.equal(document.querySelectorAll('[data-shot-dialog]').length,1);
    assert.equal(document.querySelector('[data-shot-content]').children.length,0);
    for (const card of cards) {
      card.click();
      assert.equal(dialog.open,true);
      assert.equal(dialog.querySelector('article').dataset.shot,card.dataset.shotOpen);
      assert.equal(dialog.querySelectorAll('.shot-media').length,0);
      assert.equal(document.documentElement.style.overflow,'hidden');
      assert.equal(document.activeElement.id,'active-shot-title');
      dialog.querySelector('[data-shot-open]').click();
      assert.notEqual(dialog.querySelector('article').dataset.shot,card.dataset.shotOpen);
      dialog.querySelector('[data-shot-close]').click();
      assert.equal(document.activeElement,card);
      assert.equal(document.documentElement.style.overflow,'');
      assert.equal(dialog.querySelector('article'),null);
    }
  } finally { window.close(); }
});

test('media activation is deferred, muted and stopped on close; image errors use fallback', async () => {
  const {window,dialog,observers} = fixture();
  try {
    const template = document.querySelector('[data-shot-template]');
    addMediaFixture(template, '<video data-shot-video data-src="/test.webm"></video><iframe data-shot-embed data-src="https://player.vimeo.com/video/123?autoplay=1"></iframe><img data-image-fallback="/fallback.png" src="/test.jpg">');
    document.querySelector('.curated-grid button').click();
    const video=dialog.querySelector('video'), iframe=dialog.querySelector('iframe');
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
    dialog.dispatchEvent(new window.PointerEvent('pointerdown',{clientX:100,clientY:100,bubbles:true}));
    dialog.dispatchEvent(new window.MouseEvent('click',{clientX:100,clientY:100,bubbles:true}));
    assert.equal(dialog.open,true);
    dialog.dispatchEvent(new window.PointerEvent('pointerdown',{clientX:100,clientY:20,bubbles:true}));
    dialog.dispatchEvent(new window.MouseEvent('click',{clientX:100,clientY:20,bubbles:true}));
    assert.equal(dialog.open,false);
  } finally { window.close(); }
});
