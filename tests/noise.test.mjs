import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { Window } from 'happy-dom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

// Compile the supplied JSX for Node without loading its browser-only CSS import.
const source = readFileSync(new URL('../src/components/vendor/Noise.jsx', import.meta.url), 'utf8').replace("import './Noise.css';", '');
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace(/from (['"])(react(?:\/jsx-runtime)?)\1/g, (_, quote, name) => `from ${quote}${import.meta.resolve(name)}${quote}`);
const { default: Noise } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('noise sizes to its container, honors props, pauses motion and releases observers and frames', async () => {
  const window = new Window();
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
  const preference = new window.EventTarget();
  preference.matches = false;
  window.matchMedia = () => preference;
  const frames = new Map();
  let nextFrame = 0;
  window.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  globalThis.ResizeObserver = globalThis.IntersectionObserver = Observer;
  const contexts = new Map();
  window.HTMLCanvasElement.prototype.getContext = function () {
    if (!contexts.has(this)) contexts.set(this, {
      draws: 0,
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData(pixels) { this.pixels = pixels; },
      createPattern: () => ({}),
      setTransform(...values) { this.transform = values; },
      clearRect() {},
      fillRect() { this.draws++; }
    });
    return contexts.get(this);
  };
  const host = document.createElement('div');
  document.body.append(host);
  host.getBoundingClientRect = () => ({ width: 600, height: 400 });
  const root = createRoot(host);
  try {
    await act(() => root.render(createElement(Noise, { patternSize: 50, patternScaleX: 2, patternScaleY: 3, patternAlpha: 10 })));
    const canvas = host.querySelector('canvas');
    const context = contexts.get(canvas);
    const tile = [...contexts.keys()].find(item => item !== canvas);
    assert.deepEqual([canvas.width, canvas.height], [600, 400]);
    assert.deepEqual([tile.width, tile.height], [50, 50]);
    assert.equal(contexts.get(tile).pixels.data[3], 10);
    assert.deepEqual(context.transform, [2, 0, 0, 3, 0, 0]);
    assert.equal(canvas.getAttribute('aria-hidden'), 'true');
    assert.equal(frames.size, 1);
    const advance = () => { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(); };
    advance();
    const draws = context.draws;
    advance();
    assert.equal(context.draws, draws, 'The second frame does not refresh the grain');
    preference.matches = true;
    preference.dispatchEvent(new window.Event('change'));
    assert.equal(frames.size, 0, 'Reduced motion leaves a static texture');
    preference.matches = false;
    preference.dispatchEvent(new window.Event('change'));
    assert.equal(frames.size, 1);
    observers[1].callback([{ isIntersecting: false }]);
    assert.equal(frames.size, 0);
    observers[1].callback([{ isIntersecting: true }]);
    assert.equal(frames.size, 1);
    Object.defineProperty(document, 'hidden', { value: true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    assert.equal(frames.size, 0);
  } finally {
    await act(() => root.unmount());
    assert.ok(observers.every(observer => observer.disconnected));
    assert.equal(frames.size, 0);
    Object.defineProperty(document, 'hidden', { value: false });
    document.dispatchEvent(new window.Event('visibilitychange'));
    preference.dispatchEvent(new window.Event('change'));
    assert.equal(frames.size, 0, 'Unmount removed event listeners');
    window.close();
  }
});
