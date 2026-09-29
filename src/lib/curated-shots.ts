export const CARD_FALLBACK = '/assets/curated-shots/card-fallback.png';
export const MEDIA_FALLBACK = '/assets/curated-shots/media-fallback.png';

export interface LexicalNode {
  type: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  children?: LexicalNode[];
}
export type ShotText = string | { root: LexicalNode };

export interface ShotMedia {
  type: 'image' | 'video' | 'youtube' | 'gif';
  src?: string;
  alt?: string;
  poster?: string;
  description?: ShotText;
}
export interface CuratedShot {
  slug: string;
  title?: string;
  order: number;
  published?: boolean;
  thumbnail?: string;
  thumbnailAlt?: string;
  overview?: ShotText;
  media?: ShotMedia[] | null;
}
export const shotTitle = (shot: Pick<CuratedShot, 'title' | 'slug'>) => shot.title?.trim() || shot.slug.replaceAll('-', ' ');
export const shotParagraphs = (text?: string | null): string[] =>
  (text ?? '').trim().split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);

const escapeHTML = (text: string): string => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const safeLink = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'mailto:'].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
};

/** Render only known Lexical nodes and escaped text from the public CMS response. */
export function shotRichTextHTML(value?: ShotText | null): string {
  if (!value) return '';
  if (typeof value === 'string') return shotParagraphs(value).map(text => `<p>${escapeHTML(text)}</p>`).join('');
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

/** Allow local public assets and HTTPS media; never render arbitrary embed HTML. */
export function mediaURL(value?: string): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return url;
    if (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) return url;
    return undefined;
  } catch { return undefined; }
}

export function embedURL(type: ShotMedia['type'], source?: string, autoplay = true): string | undefined {
  if (!source) return undefined;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') return undefined;
    const host = url.hostname.replace(/^www\./, '');
    if (type === 'youtube' && ['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return undefined;
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${Number(autoplay)}&mute=1&playsinline=1&rel=0&loop=1&playlist=${id}`;
    }
  } catch { /* Invalid content uses the artwork fallback. */ }
  return undefined;
}

export function validateShots(entries: CuratedShot[]): CuratedShot[] {
  const slugs = new Set<string>();
  for (const shot of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shot.slug) || slugs.has(shot.slug)) throw new Error(`Invalid or duplicate curated shot slug: ${shot.slug}`);
    slugs.add(shot.slug);
    if (!Number.isFinite(shot.order) || (shot.media != null && !Array.isArray(shot.media))) throw new Error(`Invalid curated shot: ${shot.slug}`);
    for (const media of shot.media ?? []) {
      if (!['image', 'video', 'youtube', 'gif'].includes(media.type)) throw new Error(`Invalid media type in ${shot.slug}`);
    }
  }
  return entries.filter(shot => shot.published !== false).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** Only media with a usable source appears in the opened shot. */
export function shotMedia(shot: CuratedShot): ShotMedia[] {
  return (shot.media ?? []).filter(item => (
    item.type === 'image' || item.type === 'video' || item.type === 'gif'
      ? Boolean(mediaURL(item.src))
      : Boolean(embedURL(item.type, item.src))
  ));
}
