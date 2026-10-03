import { normalizePayloadMedia, type MediaAsset, type PayloadUpload } from './media-assets.ts';

/** Existing CMS metadata contract; page blocks and galleries are intentionally not invented. */
export interface CuratedProject {
  id?: number | string;
  slug: string;
  title: string;
  client: string;
  year?: string | null;
  role?: string | null;
  summary?: string | null;
  collaborations?: { name: string }[] | null;
  stack?: { name: string }[] | null;
  order: number;
  featured?: boolean | null;
  heroMedia?: MediaAsset;
  thumbnail?: MediaAsset;
}
export interface PayloadProject extends Omit<CuratedProject, 'heroMedia' | 'thumbnail'> {
  _status?: 'draft' | 'published';
  heroMedia?: PayloadUpload;
  thumbnail?: PayloadUpload;
}
export function fromPayloadProject(doc: PayloadProject, base: string): CuratedProject {
  return {
    id: doc.id, slug: doc.slug, title: doc.title, client: doc.client,
    year: doc.year, role: doc.role, summary: doc.summary,
    collaborations: doc.collaborations, stack: doc.stack,
    order: doc.order, featured: doc.featured,
    heroMedia: normalizePayloadMedia(doc.heroMedia, base),
    thumbnail: normalizePayloadMedia(doc.thumbnail, base),
  };
}

/** Call from future Project pages at build time; merely importing does not fetch. */
export async function fetchPayloadProjects(base: string, request: typeof fetch = fetch): Promise<CuratedProject[]> {
  const projects: CuratedProject[] = [];
  const slugs = new Set<string>();
  let page = 1;
  while (true) {
    const endpoint = new URL('/api/curated-projects', base);
    endpoint.search = new URLSearchParams({ depth: '1', limit: '100', page: String(page), sort: 'order', 'where[_status][equals]': 'published' }).toString();
    const response = await request(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Payload curated projects request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.docs)) throw new Error('Payload returned an invalid curated projects response');
    for (const doc of data.docs as PayloadProject[]) {
      if (doc._status === 'draft') continue;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug) || slugs.has(doc.slug) ||
          !Number.isFinite(doc.order) || !doc.title?.trim() || !doc.client?.trim()) {
        throw new Error('Invalid or duplicate curated project');
      }
      slugs.add(doc.slug);
      projects.push(fromPayloadProject(doc, base));
    }
    if (!data.hasNextPage) break;
    if (!Number.isInteger(data.nextPage) || data.nextPage <= page) throw new Error('Invalid Payload pagination');
    page = data.nextPage;
  }
  return projects.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
