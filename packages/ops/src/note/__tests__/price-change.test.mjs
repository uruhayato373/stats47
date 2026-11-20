import test from 'node:test';
import assert from 'node:assert/strict';
import { liveProblems, plannedChanges, preflightProblems } from '../lib/price-change.mjs';

const change = { experimentId: 'PRICE-A', productKey: 'pack', fromYen: 5000, toYen: 1980, status: 'planned' };
const note = { user: { urlname: 'stats47' }, status: 'published', has_draft: false, price: 5000, body: '<a embedded-service="attachment"></a>', separator: 's', hashtag_notes: [1, 2] };

test('台帳に書いた未適用の変更だけを返し、無い実験と無い記事は止める', () => {
  const history = { experiments: [{ id: 'PRICE-A' }], changes: [change, { ...change, productKey: 'done', status: 'applied' }] };
  assert.deepEqual(plannedChanges(history, 'PRICE-A').map((c) => c.productKey), ['pack']);
  assert.throws(() => plannedChanges(history, 'PRICE-B'), /実験が台帳に無い/);
  assert.throws(() => plannedChanges(history, 'PRICE-A', 'done'), /未適用の変更が台帳に無い/);
});

test('公開中の価格が台帳と違う記事・下書きのある記事は更新しない', () => {
  assert.deepEqual(preflightProblems(change, note), []);
  assert.match(preflightProblems(change, { ...note, price: 4000 })[0], /台帳の変更前/);
  const withDraft = { ...note, has_draft: true, name: 't' };
  assert.deepEqual(preflightProblems(change, withDraft, { body: note.body, name: 't', price: 5000 }), []);
  assert.match(preflightProblems(change, withDraft, { body: '<p>別の編集</p>', name: 't', price: 5000 })[0], /下書き/);
  assert.match(preflightProblems(change, withDraft)[0], /下書き/);
});

test('読み戻しは価格だけが変わったことを確かめる', () => {
  const after = { ...note, price: 1980 };
  assert.deepEqual(liveProblems(change, note, after), []);
  assert.deepEqual(liveProblems(change, note, note), ['価格が 5000']);
  assert.ok(liveProblems(change, note, { ...after, body: '<p></p>' }).includes('添付の数が変わった'));
  assert.ok(liveProblems(change, note, { ...after, separator: 'x' }).includes('有料の境界が変わった'));
});
