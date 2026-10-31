import type { MediaAsset } from './media-assets.ts';
import type { LexicalNode, RichText } from './rich-text.ts';

/** Source-independent Project page model shared by local JSON and the Payload adapter. */
export interface ProjectImage {
  image?: MediaAsset;
  /** Percent of the card's media width; values above 100 bleed past the card padding. */
  width?: number | null;
  /** Percent of the media width, so compositions scale with the viewport. */
  offsetX?: number | null;
  offsetY?: number | null;
  radius?: 'none' | 'small' | 'large' | null;
}
export interface ProjectTile { eyebrow?: string | null; title: string; body?: string | null; }
export interface ProjectStoryItem { label?: string | null; body?: RichText | null; closing?: string | null; }
interface SectionBase { id?: string | null; navLabel?: string | null; }
export interface ProjectTilesSection extends SectionBase {
  blockType: 'tiles';
  heading?: string | null;
  intro?: RichText | null;
  variant?: 'stat' | 'phase' | null;
  tiles?: ProjectTile[] | null;
}
export interface ProjectStorySection extends SectionBase {
  blockType: 'story';
  eyebrow?: string | null;
  heading?: string | null;
  intro?: RichText | null;
  spacing?: 'default' | 'compact' | null;
  items?: ProjectStoryItem[] | null;
}
export interface ProjectVisualSection extends SectionBase {
  blockType: 'visual';
  caption?: string | null;
  layout?: 'stack' | 'overlap' | null;
  spacing?: 'default' | 'compact' | null;
  /** Space above when the previous section is also a visual card. */
  gap?: 'default' | 'large' | null;
  bleed?: 'none' | 'bottom' | null;
  images?: ProjectImage[] | null;
}
export type ProjectSection = ProjectTilesSection | ProjectStorySection | ProjectVisualSection;

export interface CuratedProject {
  id?: number | string;
  slug: string;
  title: string;
  /** Project Card subtitle on the homepage. */
  subtitle?: string | null;
  seoDescription?: string | null;
  client: string;
  clientLabel?: string | null;
  year?: string | null;
  role?: string | null;
  industry?: string | null;
  status?: string | null;
  summary?: RichText | null;
  collaborations?: { name: string }[] | null;
  stack?: { name?: string | null; tool?: string | null }[] | null;
  stackDetails?: { eyebrow?: string | null; heading?: string | null; intro?: string | null } | null;
  challenge?: { navLabel?: string | null; eyebrow?: string | null; heading?: string | null; body?: RichText | null } | null;
  audience?: { heading?: string | null; tiles?: ProjectTile[] | null } | null;
  sections?: ProjectSection[] | null;
  order: number;
  featured?: boolean | null;
  published?: boolean | null;
  heroMedia?: MediaAsset;
  thumbnail?: MediaAsset;
}

export const PROJECT_FALLBACK = '/assets/curated-shots/media-fallback.png';
export const projectHref = (slug: string) => `/projects/${slug}/`;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validateProjects(entries: CuratedProject[]): CuratedProject[] {
  const slugs = new Set<string>();
  for (const project of entries) {
    if (!slugPattern.test(project.slug) || slugs.has(project.slug) ||
        !Number.isFinite(project.order) || !project.title?.trim() || !project.client?.trim()) {
      throw new Error(`Invalid or duplicate curated project: ${project.slug}`);
    }
    if (project.sections != null && !Array.isArray(project.sections)) throw new Error(`Invalid project sections: ${project.slug}`);
    slugs.add(project.slug);
  }
  return entries.filter(project => project.published !== false)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** "CTO, PM & Engineering" from ordered names. */
export function formatList(names: string[]): string {
  const items = names.map(name => name.trim()).filter(Boolean);
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} & ${items.at(-1)}` : items[0] ?? '';
}

export function projectFacts(project: CuratedProject): { label: string; value: string }[] {
  return [
    ['Role', project.role],
    [project.clientLabel?.trim() || 'Client', project.client],
    ['Year', project.year],
    ['Collaborators', formatList((project.collaborations ?? []).map(item => item.name))],
    ['Industry', project.industry],
    ['Status', project.status],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]?.trim()))
    .map(([label, value]) => ({ label, value: value.trim() }));
}

const anchor = (label: string) => label.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

/** Stable, unique in-page anchors for the challenge and every labelled section. */
export function projectAnchors(project: CuratedProject): { overview?: string; sections: (string | undefined)[]; links: { label: string; href: string }[] } {
  const used = new Set<string>();
  const links: { label: string; href: string }[] = [];
  const reserve = (label?: string | null) => {
    if (!label?.trim()) return undefined;
    let id = anchor(label);
    for (let suffix = 2; used.has(id); suffix++) id = `${anchor(label)}-${suffix}`;
    used.add(id);
    links.push({ label: label.trim(), href: `#${id}` });
    return id;
  };
  const overview = reserve(project.challenge?.navLabel);
  return { overview, sections: (project.sections ?? []).map(section => reserve(section.navLabel)), links };
}

/** Plain text for meta descriptions; rich text structure is not needed there. */
export function richTextPlain(value?: RichText | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  const collect = (node: LexicalNode): string => node.type === 'linebreak' ? ' ' : node.text ?? (node.children ?? []).map(collect).join('');
  return (value.root?.children ?? []).map(collect).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function projectDescription(project: CuratedProject): string {
  const text = project.seoDescription?.trim() || richTextPlain(project.summary);
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 120 ? cut.lastIndexOf(' ') : 157)}…`;
}
