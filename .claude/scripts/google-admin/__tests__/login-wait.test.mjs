import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForProfileClosed, gscSession } from '../login-wait.mjs';

/** 時計を進める偽の sleep。isOpen は経過時間 (ms) で開閉を決める */
function clock() {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; } };
}

test('Chrome が開いて閉じられたら closed (閉じてから cookie を読むため)', async () => {
  const c = clock();
  const isOpen = () => c.now() >= 4_000 && c.now() < 20_000;
  assert.equal(await waitForProfileClosed('/p', { ...c, isOpen }), 'closed');
  assert.ok(c.now() >= 20_000);
});

test('Chrome が起動しなければ never_opened、閉じられなければ timeout (土曜の取得を止めない)', async () => {
  const a = clock();
  assert.equal(await waitForProfileClosed('/p', { ...a, isOpen: () => false, appearMs: 10_000 }), 'never_opened');
  const b = clock();
  assert.equal(await waitForProfileClosed('/p', { ...b, isOpen: () => true, closeMs: 30_000 }), 'timeout');
});

test('GSC の行が有効・期限が近いなら使える。切れている・失敗印は使えない', () => {
  const row = (state) => ({ sources: [{ source: 'note', state: 'valid' }, { source: 'gsc', state, reason: 'r' }] });
  assert.equal(gscSession(row('valid')).usable, true);
  assert.equal(gscSession(row('expiring')).usable, true);
  assert.equal(gscSession(row('expired')).usable, false);
  assert.equal(gscSession(row('unknown')).usable, false);
  assert.equal(gscSession({ sources: [] }).state, 'missing');
});
