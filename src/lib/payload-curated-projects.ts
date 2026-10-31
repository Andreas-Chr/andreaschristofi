import { normalizePayloadMedia, type PayloadUpload } from './media-assets.ts';
import { validateProjects, type CuratedProject, type ProjectImage, type ProjectSection, type ProjectVisualSection } from './curated-projects.ts';
export type { CuratedProject } from './curated-projects.ts';

type PayloadImage = Omit<ProjectImage, 'image'> & { image?: PayloadUpload };
type PayloadSection = Exclude<ProjectSection, ProjectVisualSection> | (Omit<ProjectVisualSection, 'images'> & { images?: PayloadImage[] | null });
export interface PayloadProject extends Omit<CuratedProject, 'heroMedia' | 'thumbnail' | 'sections' | 'published'> {
  _status?: 'draft' | 'published';
  heroMedia?: PayloadUpload;
  thumbnail?: PayloadUpload;
  sections?: (PayloadSection & { blockName?: string | null })[] | null;
}

/** Map populated Payload upload relationships, including nested visual images, into the UI model. */
export function fromPayloadProject(doc: PayloadProject, base: string): CuratedProject {
  return {
    id: doc.id, slug: doc.slug, title: doc.title, subtitle: doc.subtitle, seoDescription: doc.seoDescription,
    client: doc.client, clientLabel: doc.clientLabel, year: doc.year, role: doc.role,
    industry: doc.industry, status: doc.status, summary: doc.summary,
    collaborations: doc.collaborations, stack: doc.stack, stackDetails: doc.stackDetails,
    challenge: doc.challenge, audience: doc.audience,
    sections: (doc.sections ?? []).map(({ blockName: _blockName, ...section }): ProjectSection => section.blockType === 'visual'
      ? { ...section, images: (section.images ?? []).map(item => ({ ...item, image: normalizePayloadMedia(item.image, base) })) }
      : section),
    order: doc.order, featured: doc.featured,
    published: doc._status !== 'draft',
    heroMedia: normalizePayloadMedia(doc.heroMedia, base),
    thumbnail: normalizePayloadMedia(doc.thumbnail, base),
  };
}

/** Build-time public REST read. Failing CMS requests fail the build, preserving the last good deployment. */
export async function fetchPayloadProjects(base: string, request: typeof fetch = fetch): Promise<CuratedProject[]> {
  const docs: PayloadProject[] = [];
  let page = 1;
  while (true) {
    const endpoint = new URL('/api/curated-projects', base);
    // Depth counts relationship hops, so uploads nested in section blocks populate at depth 1.
    endpoint.search = new URLSearchParams({ depth: '1', limit: '100', page: String(page), sort: 'order', 'where[_status][equals]': 'published' }).toString();
    const response = await request(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Payload curated projects request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.docs)) throw new Error('Payload returned an invalid curated projects response');
    docs.push(...data.docs);
    if (!data.hasNextPage) break;
    if (!Number.isInteger(data.nextPage) || data.nextPage <= page) throw new Error('Invalid Payload pagination');
    page = data.nextPage;
  }
  return validateProjects(docs.map(doc => fromPayloadProject(doc, base)));
}
