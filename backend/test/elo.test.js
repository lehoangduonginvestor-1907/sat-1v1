const test = require('node:test');
const assert = require('node:assert');
const { rate, expected, kFactor } = require('../lib/elo');

test('equal players: winner gains what loser drops', () => {
  const r = rate({ elo: 1000, games: 20 }, { elo: 1000, games: 20 }, 1, 'classic');
  assert.strictEqual(r.deltaA, 16);
  assert.strictEqual(r.deltaB, -16);
});

test('finish mode moves half as much as classic', () => {
  const a = { elo: 1000, games: 20 };
  const b = { elo: 1000, games: 20 };
  assert.strictEqual(rate(a, b, 1, 'finish').deltaA, 8);
});

test('draw between equals changes nothing; upset win pays more', () => {
  const r = rate({ elo: 1000, games: 20 }, { elo: 1000, games: 20 }, 0.5, 'classic');
  assert.strictEqual(r.deltaA, 0);
  const upset = rate({ elo: 900, games: 20 }, { elo: 1100, games: 20 }, 1, 'classic');
  assert.ok(upset.deltaA > 16);
  assert.ok(expected(900, 1100) < 0.5);
});

test('provisional players use a bigger K', () => {
  assert.ok(kFactor(0) > kFactor(50));
});
