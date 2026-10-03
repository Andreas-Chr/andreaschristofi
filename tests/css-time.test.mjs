import test from 'node:test';
import assert from 'node:assert/strict';
import { cssTimeToMilliseconds } from '../src/scripts/css-time.ts';

test('CSS times preserve duration across source and minified units', () => {
  for (const value of ['240ms', '.24s', '0.24s', ' 240ms ']) {
    assert.equal(cssTimeToMilliseconds(value), 240, value);
  }
  assert.equal(cssTimeToMilliseconds('1s'), 1000);
  assert.equal(cssTimeToMilliseconds('0ms'), 0);
  assert.equal(cssTimeToMilliseconds('0s'), 0);
});

test('missing or invalid CSS times use the fallback', () => {
  for (const value of ['', 'auto', '240', '-1s', '240ms garbage']) {
    assert.equal(cssTimeToMilliseconds(value), 240, value);
  }
  assert.equal(cssTimeToMilliseconds('', 160), 160);
});
