import test from 'node:test';
import assert from 'node:assert/strict';
import { richTextHTML } from '../src/lib/rich-text.ts';
import { fromPayload } from '../src/lib/payload-curated-shots.ts';
import { fromPayloadProject } from '../src/lib/payload-curated-projects.ts';
import { websiteTextStyles } from '../src/lib/website-text-styles.ts';

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

test('every existing website style survives CMS serialization and uses its existing CSS class', () => {
  for (const style of websiteTextStyles) {
    const data = { root: { type: 'root', children: [{ type: 'paragraph', $: { websiteTypography: style.id },
      children: [{ type: 'text', text: 'Styled <content>', format: 1 }],
    }] } };
    const shot = fromPayload({ slug: 'styled', order: 1, overview: data, media: [{ type: 'image', description: data }] }, 'https://cms.example.com');
    const expected = `<p class="${style.className}"><strong>Styled &lt;content&gt;</strong></p>`;
    assert.equal(richTextHTML(shot.overview), expected);
    assert.equal(richTextHTML(shot.media[0].description), expected);
    const project = fromPayloadProject({ slug: 'project', title: 'Project', client: 'Client', order: 1, summary: data }, 'https://cms.example.com');
    assert.equal(richTextHTML(project.summary), expected);
  }
});

test('style metadata is allowlisted and never becomes arbitrary HTML, CSS, or classes', () => {
  for (const style of ['" onclick="alert(1)', 'body-medium injected', '__proto__', 42]) {
    assert.equal(richTextHTML({ root: { type: 'root', children: [{ type: 'paragraph', $: { websiteTypography: style }, children: [{ type: 'text', text: 'Readable' }] }] } }), '<p>Readable</p>');
  }
});

test('heading semantics, lists, quotes and links survive typography changes', () => {
  const link = { type: 'link', fields: { url: 'https://example.com', newTab: true }, children: [{ type: 'text', text: 'Link', format: 2 }] };
  const data = { root: { type: 'root', children: [
    { type: 'heading', tag: 'h3', $: { websiteTypography: 'headings-h1-alt' }, children: [link] },
    { type: 'quote', $: { websiteTypography: 'display-medium' }, children: [{ type: 'text', text: 'Quote' }] },
    { type: 'list', listType: 'number', children: [{ type: 'listitem', $: { websiteTypography: 'body-small' }, children: [{ type: 'text', text: 'Item' }] }] },
  ] } };
  assert.match(richTextHTML(data), /^<h3 class="text-headings-h1-alt"><a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"><em>Link<\/em><\/a><\/h3>/);
  assert.match(richTextHTML(data), /<blockquote class="text-display-medium">Quote<\/blockquote>/);
  assert.match(richTextHTML(data), /<ol><li class="text-body-small">Item<\/li><\/ol>/);
  assert.equal(richTextHTML({ root: { type: 'root', children: [{ type: 'heading', tag: 'h4', children: [{ type: 'text', text: 'Legacy' }] }] } }), '<h4 class="text-headings-h4">Legacy</h4>');
});
