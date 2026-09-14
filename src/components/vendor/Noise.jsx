// Adapted from React Bits Noise (JavaScript + CSS). See LICENSE.react-bits.
import { useEffect, useRef } from 'react';
import './Noise.css';

const bounded = (value, fallback, min, max) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export default function Noise({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15
}) {
  const grainRef = useRef(null);

  useEffect(() => {
    const canvas = grainRef.current;
    const container = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !container || !ctx) return;

    const size = Math.round(bounded(patternSize, 250, 1, 1024));
    const scaleX = bounded(patternScaleX, 1, 0.1, 10);
    const scaleY = bounded(patternScaleY, 1, 0.1, 10);
    const interval = Math.round(bounded(patternRefreshInterval, 2, 1, 120));
    const alpha = Math.round(bounded(patternAlpha, 15, 0, 255));
    const tile = document.createElement('canvas');
    tile.width = tile.height = size;
    const tileCtx = tile.getContext('2d', { alpha: true });
    if (!tileCtx) return;
    const pixels = tileCtx.createImageData(size, size);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationId = 0;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const drawGrain = () => {
      if (!width || !height) return;
      const data = pixels.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 256);
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = alpha;
      }
      tileCtx.putImageData(pixels, 0, 0);
      const pattern = ctx.createPattern(tile, 'repeat');
      if (!pattern) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(pixelRatio * scaleX, 0, 0, pixelRatio * scaleY, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width / scaleX, height / scaleY);
    };

    const stop = () => {
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    };
    const loop = () => {
      if (frame++ % interval === 0) drawGrain();
      animationId = window.requestAnimationFrame(loop);
    };
    const sync = () => {
      stop();
      if (document.hidden || !visible || !alpha) return;
      drawGrain();
      if (!preference.matches) animationId = window.requestAnimationFrame(loop);
    };
    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      sync();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(canvas);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      stop();
      observer.disconnect();
      intersection.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return <canvas className="noise-overlay" ref={grainRef} aria-hidden="true" />;
}
