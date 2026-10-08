import { validateShots, type CuratedShot, type ShotMedia } from './curated-shots.ts';

import { normalizePayloadMedia, type PayloadUpload } from './media-assets.ts';
export interface PayloadShot extends Omit<CuratedShot, 'thumbnail' | 'media'> {
  _status?: 'draft' | 'published';
  thumbnail?: PayloadUpload;
  media: (Omit<ShotMedia, 'alt' | 'asset' | 'posterAsset'> & { file?: PayloadUpload; posterImage?: PayloadUpload })[];
}

/** Map populated Payload upload relationships into the source-independent UI model. */
export function fromPayload(doc: PayloadShot, base: string): CuratedShot {
  const thumbnail = normalizePayloadMedia(doc.thumbnail, base);
  return {
    slug: doc.slug, title: doc.title, order: doc.order,
    published: doc.published !== false && doc._status !== 'draft',
    thumbnail: {
      ...(thumbnail || { url: undefined, alt: '' }),
    },
    overview: doc.overview,
    media: (doc.media || []).map(item => {
      // Switching an upload row to an embed can leave a hidden file relationship.
      const asset = ['image', 'video', 'gif'].includes(item.type) ? normalizePayloadMedia(item.file, base) : undefined;
      const posterAsset = normalizePayloadMedia(item.posterImage, base);
      return {
        type: item.type, src: asset?.url || item.src,
        alt: asset?.alt ?? '',
        poster: posterAsset?.url || item.poster,
        ...(asset ? { asset } : {}),
        ...(posterAsset ? { posterAsset } : {}),
        description: item.description,
      };
    }),
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
