import { validateProjects, type CuratedProject } from '../lib/curated-projects';
import { fetchPayloadProjects } from '../lib/payload-curated-projects';

// Same source switch as Curated Shots: Payload when configured, otherwise local JSON.
const files = import.meta.glob<{ default: CuratedProject }>('../content/curated-projects/*.json', { eager: true });
export const curatedProjects = import.meta.env.PAYLOAD_URL
  ? await fetchPayloadProjects(import.meta.env.PAYLOAD_URL)
  : validateProjects(Object.values(files).map(file => file.default));
