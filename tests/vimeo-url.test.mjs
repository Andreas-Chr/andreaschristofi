import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVimeoURL } from '../src/lib/vimeo-url.ts';
import { embedURL } from '../src/lib/curated-shots.ts';

const player = 'https://player.vimeo.com/video/76979871';

test('standard video URLs produce player URLs without playback overrides', () => {
  for (const source of [
    'https://vimeo.com/76979871', ' https://www.vimeo.com/76979871/ ',
    'https://vimeo.com/channels/staffpicks/76979871',
    'https://vimeo.com/groups/animation/videos/76979871',
    'https://vimeo.com/album/123/video/76979871',
    'https://vimeo.com/showcase/123/video/76979871', player,
  ]) {
    assert.equal(embedURL('vimeo', source), player);
    assert.equal(embedURL('vimeo', source, false), player);
  }
});

test('unlisted path and query hashes survive canonicalization', () => {
  for (const source of ['https://vimeo.com/76979871/abc123', 'https://vimeo.com/76979871?h=abc123', `${player}?h=abc123`]) {
    assert.deepEqual(parseVimeoURL(source), { id: '76979871', hash: 'abc123', playerURL: `${player}?h=abc123` });
  }
});

test('explicit playback preferences retain every supported boolean spelling', () => {
  for (const value of ['0', '1', 'true', 'false']) {
    const source = `${player}?autoplay=${value}&muted=${value}&loop=${value}&playsinline=${value}&background=${value}&autopause=${value}`;
    assert.equal(embedURL('vimeo', source), source);
    assert.equal(embedURL('vimeo', source, false), source);
  }
});

test('iframe codes extract only a validated player source and decode attribute entities', () => {
  const expected = `${player}?h=abc123&autoplay=0&muted=1&loop=true&controls=0`;
  for (const source of [
    `<iframe src="${expected.replaceAll('&', '&amp;')}" width="640" height="360" allow="autoplay; fullscreen" allowfullscreen></iframe>`,
    `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src='${expected}' style="position:absolute;width:100%;height:100%" title="A > B"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`,
    `<IFRAME SRC="${expected.replaceAll('&', '&#38;')}" onload="alert(1)" srcdoc="unsafe"></IFRAME>`,
    `<iframe src="${expected.replaceAll('&', '&#x26;')}"></iframe>`,
  ]) assert.equal(embedURL('vimeo', source), expected);
  assert.equal(embedURL('vimeo', `<iframe src=${player} allowfullscreen></iframe>`), player);
});

test('supported presentation, quality, captions and timecodes survive; unknown parameters are discarded', () => {
  const source = `${player}?controls=0&title=false&byline=0&portrait=0&dnt=1&color=00adef&colors=000000,ffffff&quality=1080p&preload=none&texttrack=en-US.captions&audiotrack=main&pip=1&speed=1&unknown=1&app_id=58479#t=1m2s`;
  const parsed = new URL(embedURL('vimeo', source));
  assert.equal(parsed.searchParams.get('colors'), '000000,ffffff');
  assert.equal(parsed.searchParams.get('texttrack'), 'en-US.captions');
  assert.equal(parsed.searchParams.get('quality'), '1080p');
  assert.equal(parsed.searchParams.get('controls'), '0');
  assert.equal(parsed.searchParams.get('unknown'), null);
  assert.equal(parsed.searchParams.get('app_id'), '58479');
  assert.equal(parsed.hash, '#t=1m2s');
  for (const time of ['1m', '1h', '1h2m3s', '90', '90s', '1.5s']) assert.equal(new URL(embedURL('vimeo', `${player}#t=${time}`)).hash, `#t=${time}`);
  assert.equal(embedURL('vimeo', `${player}#unsafe`), player);
});

test('the supplied Vimeo player URL retains every generated parameter', () => {
  const source = 'https://player.vimeo.com/video/1233355933?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&muted=1&loop=1';
  assert.equal(embedURL('vimeo', source), source);
  assert.equal(embedURL('vimeo', `<iframe src="${source.replaceAll('&', '&amp;')}"></iframe>`), source);
});

test('iframe dimensions supply a responsive aspect ratio without accepting arbitrary styles', () => {
  for (const [width, height, ratio] of [['640', '360', 16 / 9], ['640', '480', 4 / 3], ['360', '640', 9 / 16]]) {
    assert.equal(parseVimeoURL(`<iframe src="${player}" width="${width}" height="${height}" style="color:red" onload="alert(1)"></iframe>`).aspectRatio, ratio);
  }
  for (const size of ['width="100%" height="100%"', 'width="0" height="360"', 'width="-1" height="360"', 'width="640"', '']) {
    assert.equal(parseVimeoURL(`<iframe src="${player}" ${size}></iframe>`).aspectRatio, undefined);
  }
  assert.equal(parseVimeoURL(`<div style="padding:75% 0 0 0;position:relative"><iframe src="${player}" style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe></div><script>alert(1)</script>`).aspectRatio, 4 / 3);
  assert.equal(parseVimeoURL(`<div style="padding-top:177.77777777777777%;"><iframe src="${player}"></iframe></div>`).aspectRatio, 9 / 16);
});

test('untrusted, malformed, ambiguous or invalid Vimeo sources are rejected', () => {
  for (const source of [
    undefined, null, {}, '', 'not a URL', 'http://vimeo.com/76979871',
    'https://vimeo.com.evil.test/76979871', 'https://player.vimeo.com.evil.test/video/76979871',
    'https://www.player.vimeo.com/video/76979871', 'https://vimeo.com',
    'https://user:password@vimeo.com/76979871', 'https://vimeo.com:8443/76979871',
    'https://vimeo.com/0', `${player}?h=bad%20hash`, `${player}?h=`, `${player}?h=one&h=two`,
    'https://vimeo.com/76979871/one?h=two', `${player}?autoplay=yes`, `${player}?muted=2`,
    `${player}?loop=1&loop=0`, `${player}?controls=0&controls=0`, `${player}?color=bad`,
    `${player}?playsinline=`, `${player}?quality=banana`, `${player}?texttrack=%3Cscript%3E`,
    '<iframe src="javascript:alert(1)"></iframe>', '<iframe src="https://evil.test/video/76979871"></iframe>',
    '<iframe src="https://vimeo.com/76979871"></iframe>', `<iframe data-src="${player}"></iframe>`,
    `<iframe src="${player}" src="https://evil.test"></iframe>`,
    `<iframe src="${player}"></iframe><iframe src="${player}"></iframe>`,
    `<iframe src="${player}">`, 'x'.repeat(8193), `${player}\n?autoplay=1`,
  ]) assert.equal(parseVimeoURL(source), undefined, String(source).slice(0, 180));
});
