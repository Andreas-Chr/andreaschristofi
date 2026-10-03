/** URL delivery uses the zone and public source verified in the delivery audit. */
export const MEDIA_DELIVERY = {
  transformOrigin: 'https://andreaschristofi.com',
  sourceOrigin: 'https://cms.andreaschristofi.com',
  sourcePath: '/api/media/file/',
  // Keep quality stable while Cloudflare negotiates the output format.
  quality: 90,
} as const;

/** Shared width vocabulary keeps generated variants bounded and reusable. */
export const IMAGE_PRESETS = {
  card: { widths: [320, 480, 640, 800, 1024], defaultWidth: 800 },
  content: { widths: [480, 640, 800, 1024, 1200, 1440, 1600], defaultWidth: 1024 },
  hero: { widths: [640, 800, 1024, 1440, 1920, 2560], defaultWidth: 1440 },
  gallery: { widths: [320, 480, 640, 800, 1024, 1440, 1920], defaultWidth: 800 },
  poster: { widths: [480, 640, 800, 1024, 1440, 1920], defaultWidth: 1024 },
} as const;
export type ImagePreset = keyof typeof IMAGE_PRESETS;
