import test from 'node:test';
import assert from 'node:assert/strict';
import { richTextHTML } from '../src/lib/rich-text.ts';
import { fromPayload } from '../src/lib/payload-curated-shots.ts';

const linkedText = (url, type = 'link', newTab = true) => ({ root: {
  type: 'root', children: [{ type: 'paragraph', children: [{ type,
    fields: { linkType: 'custom', url, newTab },
    children: [{ type: 'text', text: 'decol24.com', format: 1 }],
  }] }],
} });

test('Payload overview and media descriptions retain the reported HTTP link', () => {
  const description = linkedText('http://decol24.com/');
  const shot = fromPayload({ slug: 'debtcollection-ticketing', order: 1,
    overview: description, media: [{ type: 'image', description }],
  }, 'https://cms.example.com');
  const expected = '<p><a href="http://decol24.com/" target="_blank" rel="noopener noreferrer"><strong>decol24.com</strong></a></p>';
  assert.equal(richTextHTML(shot.overview), expected);
  assert.equal(richTextHTML(shot.media[0].description), expected);
});

test('standard links and autolinks preserve supported URLs and same-tab behavior', () => {
  for (const type of ['link', 'autolink']) {
    for (const url of ['http://decol24.com/', 'https://example.com/', 'mailto:hello@example.com', '/work/example']) {
      assert.equal(richTextHTML(linkedText(url, type, false)), `<p><a href="${url}"><strong>decol24.com</strong></a></p>`);
    }
  }
  const legacy = { root: { type: 'root', children: [{ type: 'link', url: 'http://example.com', children: [{ type: 'text', text: 'Legacy' }] }] } };
  assert.equal(richTextHTML(legacy), '<a href="http://example.com">Legacy</a>');
});

test('unsafe and malformed links stay readable without executable anchors', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'vbscript:msgbox(1)', '//evil.test', '/\\evil.test', '/\tevil.test', 'java\nscript:alert(1)', '', 'not a URL', 42]) {
    assert.equal(richTextHTML(linkedText(url)), '<p><strong>decol24.com</strong></p>');
  }
  assert.equal(richTextHTML(linkedText('  http://decol24.com/  ', 'link', false)), '<p><a href="http://decol24.com/"><strong>decol24.com</strong></a></p>');
  assert.match(richTextHTML(linkedText('https://example.com/?a="value"&b=2')), /a=&quot;value&quot;&amp;b=2/);
});
