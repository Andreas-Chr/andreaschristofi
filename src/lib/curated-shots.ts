export const CARD_FALLBACK = '/assets/curated-shots/card-fallback.png';
export const MEDIA_FALLBACK = '/assets/curated-shots/media-fallback.png';
export const LOREM_IPSUM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eleifend aliquam massa eget suscipit. Morbi eleifend interdum lectus, ut commodo felis rhoncus nec. Sed non semper neque, et rhoncus felis. Nunc vitae nisi dictum, scelerisque quam pharetra.';

export interface ShotMedia {
  type: 'image' | 'video' | 'youtube' | 'vimeo';
  src?: string;
  alt?: string;
  poster?: string;
  description?: string;
  visible?: boolean;
  showDescription?: boolean;
  /** Optional WebVTT captions for uploaded videos. */
  captions?: string;
  captionsLanguage?: string;
}
export interface CuratedShot {
  slug: string;
  title?: string;
  order: number;
  published?: boolean;
  content: 'long' | 'short';
  thumbnail?: string;
  thumbnailAlt?: string;
  overview?: string;
  media: ShotMedia[];
}
export const shotTitle = (shot: Pick<CuratedShot, 'title'>) => shot.title?.trim() || 'Lorem Ipsum';
export const shotText = (text?: string) => text?.trim() || LOREM_IPSUM;

/** Allow local public assets and HTTPS media; never render arbitrary embed HTML. */
export function mediaURL(value?: string): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url;
  try { return new URL(url).protocol === 'https:' ? url : undefined; } catch { return undefined; }
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
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${Number(autoplay)}&mute=1&playsinline=1&rel=0`;
    }
    if (type === 'vimeo' && ['vimeo.com', 'player.vimeo.com'].includes(host)) {
      const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
      if (!match) return undefined;
      const embed = new URL(`https://player.vimeo.com/video/${match[1]}`);
      const hash = url.searchParams.get('h') || match[2];
      if (hash) embed.searchParams.set('h', hash);
      embed.searchParams.set('autoplay', String(Number(autoplay)));
      embed.searchParams.set('muted', '1');
      embed.searchParams.set('playsinline', '1');
      return embed.href;
    }
  } catch { /* Invalid content uses the artwork fallback. */ }
  return undefined;
}

export function validateShots(entries: CuratedShot[]): CuratedShot[] {
  const slugs = new Set<string>();
  for (const shot of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shot.slug) || slugs.has(shot.slug)) throw new Error(`Invalid or duplicate curated shot slug: ${shot.slug}`);
    slugs.add(shot.slug);
    if (!['long', 'short'].includes(shot.content) || !Number.isFinite(shot.order) || !Array.isArray(shot.media)) throw new Error(`Invalid curated shot: ${shot.slug}`);
    for (const media of shot.media) {
      if (!['image', 'video', 'youtube', 'vimeo'].includes(media.type)) throw new Error(`Invalid media type in ${shot.slug}`);
    }
  }
  return entries.filter(shot => shot.published !== false).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** The first slot always exists; empty Long entries reproduce Figma's three slots. */
export function shotMedia(shot: CuratedShot): ShotMedia[] {
  const media = shot.media.length ? shot.media : Array.from({ length: shot.content === 'long' ? 3 : 1 }, () => ({ type: 'image' as const }));
  return shot.content === 'short' ? media.slice(0, 1) : media;
}
