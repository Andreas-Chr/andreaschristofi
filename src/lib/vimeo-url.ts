// Supported player parameters: https://help.vimeo.com/hc/en-us/articles/12426260232977
const booleanParameters = new Set([
  'airplay', 'ask_ai', 'audio_track', 'autopause', 'autoplay', 'background', 'badge', 'byline',
  'cc', 'chapters', 'chromecast', 'controls', 'dnt', 'fullscreen', 'interactive_markers',
  'keyboard', 'loop', 'muted', 'pip', 'playsinline', 'portrait', 'progress_bar',
  'quality_selector', 'skipping_forward', 'speed', 'title', 'transparent', 'transcript',
  'unmute_button', 'vimeo_logo', 'volume', 'watch_full_video',
]);
const qualityParameters = new Set(['quality', 'initial_quality', 'min_quality', 'max_quality']);
const otherParameters = new Set([
  'color', 'colors', 'audiotrack', 'texttrack', 'preload', 'play_button_position',
  'thumbnail_id', 'player_id', 'app_id', 'interactive_params',
]);

function supportedParameter(name: string, value: string): boolean {
  if (booleanParameters.has(name)) return /^(?:0|1|true|false)$/.test(value);
  if (qualityParameters.has(name)) return /^(?:auto|240p|360p|540p|720p|1080p|2k|4k)$/.test(value);
  switch (name) {
    case 'color': return /^[a-fA-F0-9]{6}$/.test(value);
    case 'colors': return /^[a-fA-F0-9]{6}(?:,[a-fA-F0-9]{6}){0,3}$/.test(value);
    case 'audiotrack': return /^(?:main|[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*)$/.test(value);
    case 'texttrack': return /^(?:false|[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*(?:\.(?:captions|subtitles))?)$/.test(value);
    case 'preload': return /^(?:metadata|metadata_on_hover|auto|auto_on_hover|none)$/.test(value);
    case 'play_button_position': return /^(?:auto|bottom|center)$/.test(value);
    case 'thumbnail_id': return /^[1-9]\d*$/.test(value);
    case 'app_id': return /^\d+$/.test(value);
    case 'player_id': return /^[a-zA-Z0-9_-]{1,128}$/.test(value);
    case 'interactive_params': return /^[a-zA-Z0-9_-]+=[^,<>\u0000-\u001f]+(?:,[a-zA-Z0-9_-]+=[^,<>\u0000-\u001f]+)*$/.test(value);
    default: return false;
  }
}

function decodeAttribute(value: string): string {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[a-fA-F0-9]+);/g, entity => {
    const named: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (entity in named) return named[entity];
    const code = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\uFFFD';
  });
}

function readAttributes(attributes: string): Map<string, string> | undefined {
  const attribute = /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/gy;
  let offset = 0;
  const values = new Map<string, string>();
  while (offset < attributes.length) {
    if (!attributes.slice(offset).trim()) break;
    attribute.lastIndex = offset;
    const match = attribute.exec(attributes);
    if (!match) return undefined;
    offset = attribute.lastIndex;
    const name = match[1].toLowerCase();
    if (values.has(name)) return undefined;
    values.set(name, decodeAttribute(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return values;
}

/** Extract only a single iframe's source and numeric ratio. Never render supplied HTML. */
function iframeSource(source: string): { src: string; aspectRatio?: number } | undefined {
  const frames = [...source.matchAll(/<iframe\b((?:[^<>"']|"[^"]*"|'[^']*')*)>/gi)];
  if (frames.length !== 1 || !/<\/iframe\s*>/i.test(source)) return undefined;
  const attributes = readAttributes(frames[0][1]);
  const src = attributes?.get('src');
  if (!src) return undefined;
  const dimension = (name: string) => {
    const value = attributes?.get(name) ?? '';
    return /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : 0;
  };
  const width = dimension('width'), height = dimension('height');
  let aspectRatio = width > 0 && height > 0 && Number.isFinite(width / height) ? width / height : undefined;
  if (!aspectRatio) {
    // Vimeo's responsive code puts percentage padding on the immediate div wrapper.
    const wrapper = source.slice(0, frames[0].index).match(/<div\b((?:[^<>"']|"[^"]*"|'[^']*')*)>\s*$/i);
    const style = wrapper ? readAttributes(wrapper[1])?.get('style') : undefined;
    const padding = style?.match(/(?:^|;)\s*padding(?:-top)?\s*:\s*(\d+(?:\.\d+)?)%(?:\s+0(?:px)?){0,3}\s*(?:;|$)/i);
    const percent = padding ? Number(padding[1]) : 0;
    if (percent > 0 && Number.isFinite(100 / percent)) aspectRatio = 100 / percent;
  }
  return { src, ...(aspectRatio ? { aspectRatio } : {}) };
}

export interface VimeoVideo {
  id: string;
  hash?: string;
  /** Validated, canonical player URL; omitted preferences stay owned by Vimeo. */
  playerURL: string;
  /** Numeric embed dimensions or wrapper padding define the ratio without copying styles. */
  aspectRatio?: number;
}

/** Parse locally without fetching metadata. Keep aligned with the CMS validator. */
export function parseVimeoURL(source: unknown): VimeoVideo | undefined {
  if (typeof source !== 'string' || source.length > 8192) return undefined;
  const input = source.trim();
  const isEmbed = input.startsWith('<');
  const iframe = isEmbed ? iframeSource(input) : undefined;
  const candidate = isEmbed ? iframe?.src : input;
  if (!candidate || /[\u0000-\u0020<>]/.test(candidate)) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined;
    const isPlayer = url.hostname === 'player.vimeo.com';
    if (isEmbed && !isPlayer) return undefined;
    const match = ['vimeo.com', 'www.vimeo.com'].includes(url.hostname)
      ? url.pathname.match(/^\/([1-9]\d*)(?:\/([a-zA-Z0-9]+))?\/?$/)
        || url.pathname.match(/^\/channels\/[^/]+\/([1-9]\d*)\/?$/)
        || url.pathname.match(/^\/groups\/[^/]+\/videos\/([1-9]\d*)\/?$/)
        || url.pathname.match(/^\/(?:album|showcase)\/\d+\/video\/([1-9]\d*)\/?$/)
      : isPlayer ? url.pathname.match(/^\/video\/([1-9]\d*)\/?$/) : null;
    if (!match) return undefined;
    const hashes = url.searchParams.getAll('h');
    if (hashes.length > 1 || (hashes.length && !/^[a-zA-Z0-9]+$/.test(hashes[0]))) return undefined;
    if (match[2] && hashes.length && match[2] !== hashes[0]) return undefined;
    const hash = match[2] || hashes[0];
    const player = new URL(`https://player.vimeo.com/video/${match[1]}`);
    if (hash) player.searchParams.set('h', hash);
    for (const [name, value] of url.searchParams) {
      const known = booleanParameters.has(name) || qualityParameters.has(name)
        || otherParameters.has(name);
      if (!known) continue;
      // Reject ambiguous or invalid preferences rather than silently change playback.
      if (player.searchParams.has(name) || !supportedParameter(name, value)) return undefined;
      player.searchParams.set(name, value);
    }
    if (/^#t=(?:\d+(?:\.\d+)?s?|\d+h(?:\d+m)?(?:\d+(?:\.\d+)?s)?|\d+m(?:\d+(?:\.\d+)?s)?)$/.test(url.hash)) player.hash = url.hash;
    return { id: match[1], ...(hash ? { hash } : {}), playerURL: player.href,
      ...(iframe?.aspectRatio ? { aspectRatio: iframe.aspectRatio } : {}) };
  } catch {
    return undefined;
  }
}
