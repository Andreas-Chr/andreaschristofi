/** Convert a CSS time to the milliseconds required by Web Animations. */
export function cssTimeToMilliseconds(value: string, fallback = 240): number {
  const match = value.trim().match(/^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/i);
  if (!match) return fallback;
  const duration = Number(match[1]) * (match[2].toLowerCase() === 's' ? 1000 : 1);
  return Number.isFinite(duration) ? duration : fallback;
}
