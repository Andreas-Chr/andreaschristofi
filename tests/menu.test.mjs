import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { setMenuPanel } from '../src/scripts/menu.ts';

function fixture() {
  const window = new Window();
  const document = window.document;
  document.body.innerHTML = '<button aria-expanded="false">Menu</button><div hidden><nav><ul><li><a href="#target">Link</a></li></ul></nav></div>';
  globalThis.document = document;
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  const trigger = document.querySelector('button');
  const panel = document.querySelector('div');
  const active = new Map();
  const calls = [];
  window.HTMLElement.prototype.getAnimations = function() { return active.get(this) || []; };
  window.HTMLElement.prototype.animate = function(frames, options) {
    let resolve, reject;
    const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
    const animation = { finished, finish: resolve, cancel() {
      active.set(this.node, (active.get(this.node) || []).filter(a => a !== this));
      reject(new Error('cancelled'));
    }, node: this, frames, options };
    active.set(this, [...(active.get(this) || []), animation]);
    calls.push(animation);
    return animation;
  };
  return { window, trigger, panel, calls };
}

test('menu closes interactivity immediately but waits for the shell to hide', async () => {
  const { window, trigger, panel, calls } = fixture();
  setMenuPanel(panel, trigger, true, false);
  panel.querySelector('a').focus();
  setMenuPanel(panel, trigger, false);
  assert.equal(panel.inert, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, trigger);
  assert.equal(panel.hidden, false);
  const content = calls.filter(a => a.node !== panel);
  content.forEach(a => a.finish());
  await Promise.resolve();
  assert.equal(panel.hidden, false);
  assert.ok(content.every(a => a.options.fill === 'both'), 'content must stay hidden until the shell finishes');
  calls.find(a => a.node === panel).finish();
  await Promise.resolve();
  assert.equal(panel.hidden, true);
  window.close();
});

test('rapid menu reversal cannot let a cancelled close hide the reopened panel', async () => {
  const { window, trigger, panel, calls } = fixture();
  setMenuPanel(panel, trigger, true);
  setMenuPanel(panel, trigger, false);
  const closing = calls.filter(a => a.node === panel).at(-1);
  setMenuPanel(panel, trigger, true);
  closing.finish();
  await Promise.resolve();
  assert.equal(panel.hidden, false);
  assert.equal(panel.inert, false);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  // A resize settles the intended state and cancels every outstanding effect.
  setMenuPanel(panel, trigger, true, false);
  assert.equal(panel.getAnimations().length, 0);
  assert.equal(panel.querySelector('li').getAnimations().length, 0);
  await Promise.resolve();
  assert.equal(panel.hidden, false);
  window.close();
});

test('reduced motion opens and closes the menu without animation effects', () => {
  const { window, trigger, panel, calls } = fixture();
  globalThis.matchMedia = () => ({ matches: true });
  setMenuPanel(panel, trigger, true);
  assert.equal(panel.hidden, false);
  setMenuPanel(panel, trigger, false);
  assert.equal(panel.hidden, true);
  assert.equal(panel.inert, true);
  assert.equal(calls.length, 0);
  window.close();
});
