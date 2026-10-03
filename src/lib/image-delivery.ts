import { mediaURL, type MediaAsset } from './media-assets.ts';
import { IMAGE_PRESETS, MEDIA_DELIVERY, type ImagePreset } from './media-delivery-config.ts';
export type { MediaAsset } from './media-assets.ts';
export type { ImagePreset } from './media-delivery-config.ts';

export interface ImageOptions {
  preset: ImagePreset;
  /** The consumer knows its layout; do not infer sizes from an asset or preset. */
  sizes: string;
  priority?: boolean;
  /** Select only the largest allowed derivative; the preset cap still applies. */
  preserveResolution?: boolean;
  enabled?: boolean;
}
export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  srcset?: string;
  sizes?: string;
  loading: 'eager' | 'lazy';
  decoding: 'async';
  fetchpriority?: 'high';
}

const dimension = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

function cmsSource(asset: MediaAsset): string | undefined {
  try {
    const url = new URL(asset.url);
    // Explicit source/path allowlist; local previews and other providers pass through.
    if (url.origin !== MEDIA_DELIVERY.sourceOrigin || url.username || url.password ||
        !url.pathname.startsWith(MEDIA_DELIVERY.sourcePath) ||
        url.pathname.length === MEDIA_DELIVERY.sourcePath.length) return undefined;
    // Revision the SOURCE so both original and derivative cache keys change on replacement.
    if (asset.updatedAt && Number.isFinite(Date.parse(asset.updatedAt))) url.searchParams.set('v', asset.updatedAt);
    url.hash = '';
    return url.href;
  } catch { return undefined; }
}

/** Revision public CMS originals even when resizing is disabled or metadata is incomplete. */
export function getOriginalImageURL(asset: MediaAsset): string {
  const safe = mediaURL(asset.url);
  if (!safe) throw new Error('Image asset requires a safe media URL');
  return cmsSource(asset) || safe;
}

/** Width-only transforms preserve proportions; cropping remains owned by layout CSS. */
export function getImageProps(asset: MediaAsset, options: ImageOptions): ImageProps {
  const src = getOriginalImageURL(asset);
  const result: ImageProps = {
    src, alt: asset.alt, loading: options.priority ? 'eager' : 'lazy', decoding: 'async',
    ...(options.priority ? { fetchpriority: 'high' as const } : {}),
  };
  const hasDimensions = dimension(asset.width) && dimension(asset.height);
  if (hasDimensions) { result.width = asset.width; result.height = asset.height; }
  const eligible = ['image/jpeg', 'image/png'].includes(asset.mimeType || '') &&
    !/\.(?:gif|svg|mp4|webm)$/i.test(new URL(src, MEDIA_DELIVERY.sourceOrigin).pathname);
  const source = options.enabled === false || !eligible ? undefined : cmsSource(asset);
  // Missing intrinsic dimensions would make scale-down width descriptors unreliable.
  if (!source || !hasDimensions) return result;
  if (!options.sizes.trim()) throw new Error('Responsive images require a layout sizes value');
  const preset = IMAGE_PRESETS[options.preset];
  const intrinsicWidth = asset.width!;
  // Include a smaller source's exact width, but never exceed the context's cap.
  const maxWidth = Math.min(preset.widths[preset.widths.length - 1], intrinsicWidth);
  const widths = options.preserveResolution ? [maxWidth]
    : [...preset.widths.filter(width => width < maxWidth), maxWidth];
  const url = (width: number) =>
    `${MEDIA_DELIVERY.transformOrigin}/cdn-cgi/image/width=${width},fit=scale-down,quality=${MEDIA_DELIVERY.quality},format=auto/${source}`;
  result.src = url(options.preserveResolution ? maxWidth : Math.min(preset.defaultWidth, maxWidth));
  result.srcset = widths.map(width => `${url(width)} ${width}w`).join(', ');
  result.sizes = options.sizes;
  return result;
}
