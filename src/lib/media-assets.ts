/** Source-independent metadata shared by Shots, Projects and image delivery. */
export interface MediaAsset {
  url: string;
  alt: string;
  id?: string | number;
  filename?: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  updatedAt?: string;
}

export type PayloadUpload = string | number | null | {
  url?: string | null;
  alt?: string | null;
  id?: string | number;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  updatedAt?: string | null;
};

/** Accept public local assets, HTTPS media and the established HTTP CMS preview. */
export function mediaURL(value?: string | null): string | undefined {
  const url = value?.trim();
  if (!url || /[\\\s]/.test(url)) return undefined;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return undefined;
    if (parsed.protocol === 'https:') return url;
    if (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) return url;
  } catch { /* Invalid sources are omitted rather than breaking a build. */ }
  return undefined;
}

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/** Unpopulated relationship IDs and missing/deleted uploads do not become URLs. */
export function normalizePayloadMedia(upload: PayloadUpload | undefined, base: string): MediaAsset | undefined {
  if (!upload || typeof upload !== 'object' || !upload.url || !mediaURL(upload.url)) return undefined;
  let url: string | undefined;
  try { url = mediaURL(new URL(upload.url, base).href); } catch { return undefined; }
  if (!url) return undefined;
  const asset: MediaAsset = { url, alt: upload.alt ?? '' };
  if (typeof upload.id === 'string' || typeof upload.id === 'number') asset.id = upload.id;
  if (upload.filename) asset.filename = upload.filename;
  if (upload.mimeType) asset.mimeType = upload.mimeType.toLowerCase().trim();
  if (positiveInteger(upload.filesize)) asset.filesize = upload.filesize;
  if (positiveInteger(upload.width)) asset.width = upload.width;
  if (positiveInteger(upload.height)) asset.height = upload.height;
  if (upload.updatedAt && Number.isFinite(Date.parse(upload.updatedAt))) asset.updatedAt = upload.updatedAt;
  return asset;
}
