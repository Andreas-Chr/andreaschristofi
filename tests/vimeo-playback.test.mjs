import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { initVimeoPlayback } from '../src/scripts/vimeo-playback.ts';

const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve)); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function fixture({ paused = false, ready = Promise.resolve() } = {}) {
  const window = new Window({ settings: { disableIframePageLoading: true } });
  const frame = window.document.createElement('iframe');
  frame.src = 'https://player.vimeo.com/video/76979871?h=abc123&controls=1';
  window.document.body.append(frame);
  const state = { active: true, reduced: false, paused, currentTime: 37.5 };
  const calls = [];
  const listeners = new Map();
  const emit = event => listeners.get(event)?.();
  const player = {
    ready: () => ready,
    getPaused: async () => state.paused,
    pause: async () => { calls.push('pause'); state.paused = true; emit('pause'); },
    play: async () => { calls.push('play'); state.paused = false; emit('play'); },
    on: (event, callback) => listeners.set(event, callback),
    off: (event, callback) => { if (listeners.get(event) === callback) listeners.delete(event); },
    destroy: async () => { calls.push('destroy'); frame.remove(); },
  };
  const playback = initVimeoPlayback(frame, {
    isActive: () => state.active,
    reducedMotion: () => state.reduced,
  }, () => player);
  const cleanup = () => { playback.dispose(); window.close(); };
  return { window, frame, state, calls, listeners, emit, player, playback, cleanup };
}

test('Vimeo pauses offscreen and resumes only visibility-paused playback without navigating or seeking', async () => {
  const f = fixture();
  try {
    const source = f.frame.src;
    f.playback.setVisible(false); await flush();
    assert.deepEqual(f.calls, ['pause']);
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause', 'play']);
    assert.equal(f.state.currentTime, 37.5);
    assert.equal(f.frame.src, source);
    assert.equal(f.frame.isConnected, true);
    f.state.paused = true; f.emit('pause');
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause', 'play'], 'a visitor pause is not overridden');
  } finally { f.cleanup(); }
});

test('a never-playing Vimeo player is not started on viewport re-entry', async () => {
  const f = fixture({ paused: true });
  try {
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, []);
  } finally { f.cleanup(); }
});

test('Vimeo readiness after leaving the viewport pauses late autoplay', async () => {
  const gate = deferred();
  const f = fixture({ ready: gate.promise });
  try {
    f.playback.setVisible(false); await flush();
    assert.deepEqual(f.calls, []);
    gate.resolve(); await flush();
    assert.deepEqual(f.calls, ['pause']);
    f.state.paused = false; f.emit('play'); await flush();
    assert.deepEqual(f.calls, ['pause', 'pause'], 'late play events offscreen are paused');
  } finally { f.cleanup(); }
});

test('rapid Vimeo return while querying state cancels the stale pause', async () => {
  const f = fixture();
  const query = deferred();
  try {
    f.player.getPaused = () => query.promise;
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true);
    query.resolve(false); await flush();
    assert.deepEqual(f.calls, []);
  } finally { f.cleanup(); }
});

test('rapid Vimeo return while pausing serializes resume after the pause completes', async () => {
  const f = fixture();
  const pause = deferred();
  try {
    f.player.pause = async () => { f.calls.push('pause'); await pause.promise; f.state.paused = true; f.emit('pause'); };
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause']);
    pause.resolve(); await flush();
    assert.deepEqual(f.calls, ['pause', 'play']);
  } finally { f.cleanup(); }
});

test('reduced motion clears pending resume and disabling it never restarts Vimeo', async () => {
  const f = fixture();
  try {
    f.playback.setVisible(false); await flush();
    f.state.reduced = true; f.playback.preventResume();
    f.playback.setVisible(true); await flush();
    f.state.reduced = false;
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause']);
    // Reduced motion still permits a visitor to use Vimeo's own play control.
    f.state.reduced = true; f.state.paused = false; f.emit('play'); await flush();
    assert.deepEqual(f.calls, ['pause']);
  } finally { f.cleanup(); }
});

test('the deliberate reduced-motion reload clears resume and restores remote event subscriptions', async () => {
  const f = fixture();
  try {
    f.playback.setVisible(false); await flush();
    f.state.reduced = true; f.playback.preventResume();
    f.frame.src = 'https://player.vimeo.com/video/76979871?h=abc123&autoplay=0&background=0&controls=1';
    f.frame.dispatchEvent(new f.window.Event('load')); await flush();
    assert.equal(f.listeners.size, 3);
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause']);
    f.state.paused = false; f.emit('play');
    f.playback.setVisible(false); await flush();
    assert.deepEqual(f.calls, ['pause', 'pause']);
  } finally { f.cleanup(); }
});

test('Vimeo disposal prevents commands after delayed initialization and removes listeners', async () => {
  const gate = deferred();
  const f = fixture({ ready: gate.promise });
  try {
    f.playback.setVisible(false); await flush();
    f.playback.dispose();
    gate.resolve(); await flush();
    assert.deepEqual(f.calls, ['destroy']);
    assert.equal(f.listeners.size, 0);
    f.playback.setVisible(true); f.frame.dispatchEvent(new f.window.Event('load')); await flush();
    assert.deepEqual(f.calls, ['destroy']);
  } finally { f.cleanup(); }
});

test('a pause response from before a preference reset cannot restore automatic resume', async () => {
  const f = fixture();
  const pause = deferred();
  try {
    f.player.pause = async () => { f.calls.push('pause'); await pause.promise; f.state.paused = true; f.emit('pause'); };
    f.playback.setVisible(false); await flush();
    f.state.reduced = true; f.playback.preventResume();
    f.state.reduced = false;
    pause.resolve(); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause']);
  } finally { f.cleanup(); }
});

test('SDK command rejection preserves the iframe and does not trigger an automatic retry or play', async () => {
  const f = fixture();
  try {
    f.player.pause = async () => { f.calls.push('pause'); throw new Error('Player unavailable'); };
    f.playback.setVisible(false); await flush();
    f.playback.setVisible(true); await flush();
    assert.deepEqual(f.calls, ['pause']);
    assert.equal(f.frame.isConnected, true);
    assert.match(f.frame.src, /controls=1/);
  } finally { f.cleanup(); }
});
