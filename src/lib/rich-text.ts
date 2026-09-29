export interface LexicalNode {
  type: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  url?: string;
  fields?: { url?: string; newTab?: boolean; linkType?: string };
  children?: LexicalNode[];
}
export type RichText = string | { root: LexicalNode };

export const richTextParagraphs = (text?: string | null): string[] =>
  (text ?? '').trim().split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);

const escapeHTML = (text: string): string => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const safeLink = (value?: string): string | undefined => {
  if (typeof value !== 'string') return undefined;
  value = value.trim();
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return undefined;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
};

/** Render only known Lexical nodes and escaped text from the public CMS response. */
export function richTextHTML(value?: RichText | null): string {
  if (!value) return '';
  if (typeof value === 'string') return richTextParagraphs(value).map(text => `<p>${escapeHTML(text)}</p>`).join('');
  const render = (node: LexicalNode): string => {
    const inner = (node.children || []).map(render).join('');
    switch (node.type) {
      case 'root': return inner;
      case 'text': {
        let text = escapeHTML(node.text || '');
        const format = typeof node.format === 'number' ? node.format : 0;
        if (format & 1) text = `<strong>${text}</strong>`;
        if (format & 2) text = `<em>${text}</em>`;
        if (format & 8) text = `<u>${text}</u>`;
        if (format & 4) text = `<s>${text}</s>`;
        if (format & 16) text = `<code>${text}</code>`;
        return text;
      }
      case 'linebreak': return '<br>';
      case 'paragraph': return `<p>${inner}</p>`;
      case 'heading': {
        const tag = /^h[2-6]$/.test(node.tag || '') ? node.tag : 'h3';
        return `<${tag}>${inner}</${tag}>`;
      }
      case 'quote': return `<blockquote>${inner}</blockquote>`;
      case 'list': {
        const tag = node.listType === 'number' ? 'ol' : 'ul';
        return `<${tag}>${inner}</${tag}>`;
      }
      case 'listitem': return `<li>${inner}</li>`;
      case 'link': case 'autolink': {
        const href = safeLink(node.fields?.url || node.url);
        return href ? `<a href="${escapeHTML(href)}"${node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>` : inner;
      }
      default: return inner;
    }
  };
  return value.root?.type === 'root' ? render(value.root) : '';
}

