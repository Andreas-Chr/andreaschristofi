import { validateShots, type CuratedShot } from '../lib/curated-shots';
import { fetchPayloadShots } from '../lib/payload-curated-shots';

// Keep the renderer independent of the source. A Payload adapter can supply the same shape.
const files = import.meta.glob<{ default: CuratedShot }>('../content/curated-shots/*.json', { eager: true });
export const curatedShots = import.meta.env.PAYLOAD_URL
  ? await fetchPayloadShots(import.meta.env.PAYLOAD_URL)
  : validateShots(Object.values(files).map(file => file.default));
