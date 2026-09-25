import { validateShots, type CuratedShot, type ShotMedia } from './curated-shots.ts';

type Upload = string | number | { url?: string; alt?: string } | null;
export interface PayloadShot extends Omit<CuratedShot, 'thumbnail' | 'media'> {
  _status?: 'draft' | 'published';
  thumbnail?: Upload;
  media: (ShotMedia & { file?: Upload; posterImage?: Upload; captionFile?: Upload })[];
}

function uploadURL(upload: Upload | undefined, base: string): string | undefined {
  if (!upload || typeof upload !== 'object' || !upload.url) return undefined;
  return new URL(upload.url, base).href;
}

/** Map populated Payload upload relationships into the source-independent UI model. */
export function fromPayload(doc: PayloadShot, base: string): CuratedShot {
  return {
    slug: doc.slug, title: doc.title, order: doc.order,
    published: doc.published !== false && doc._status !== 'draft',
    thumbnail: uploadURL(doc.thumbnail, base),
    thumbnailAlt: doc.thumbnailAlt || (typeof doc.thumbnail === 'object' ? doc.thumbnail?.alt : ''),
    overview: doc.overview,
    media: (doc.media || []).map(item => ({
      type: item.type, src: uploadURL(item.file, base) || item.src,
      alt: item.alt || (typeof item.file === 'object' ? item.file?.alt : ''),
      poster: uploadURL(item.posterImage, base) || item.poster,
      captions: uploadURL(item.captionFile, base) || item.captions,
      captionsLanguage: item.captionsLanguage,
      description: item.description, visible: item.visible, showDescription: item.showDescription,
    })),
  };
}

/** Build-time public REST read. Failing CMS requests fail the build, preserving the last good deployment. */
export async function fetchPayloadShots(base: string, request: typeof fetch = fetch): Promise<CuratedShot[]> {
  const docs: PayloadShot[] = [];
  let page = 1;
  while (true) {
    const endpoint = new URL('/api/curated-shots', base);
    endpoint.search = new URLSearchParams({ depth: '1', limit: '100', page: String(page), sort: 'order', 'where[_status][equals]': 'published' }).toString();
    const response = await request(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Payload curated shots request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.docs)) throw new Error('Payload returned an invalid curated shots response');
    docs.push(...data.docs);
    if (!data.hasNextPage) break;
    if (!Number.isInteger(data.nextPage) || data.nextPage <= page) throw new Error('Invalid Payload pagination');
    page = data.nextPage;
  }
  return validateShots(docs.map(doc => fromPayload(doc, base)));
}
