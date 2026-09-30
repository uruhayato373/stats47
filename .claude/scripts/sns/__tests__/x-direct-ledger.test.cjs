const test = require('node:test');
const assert = require('node:assert/strict');
const { planDirectLedgerWrite } = require('../lib/x-direct-ledger.cjs');

const row = (id, status, at, key = 'ratio-65-plus') => ({ id, platform: 'x', post_type: 'original', domain: 'ranking', content_key: key, status, scheduled_at: at });
const target = { domain: 'ranking', contentKey: 'ratio-65-plus' };

test('同じキーの下書きが無ければ、予約でも新しい行を足す (直接指定の予約が台帳から漏れない)', () => {
  assert.deepEqual(planDirectLedgerWrite([], target), { action: 'insert' });
});

test('既に予約済み・投稿済みの行は別の投稿なので上書きせず、新しい行を足す', () => {
  const posts = [row(1, 'scheduled', '2026-10-10T00:00:00Z'), row(2, 'posted', '2026-09-01T00:00:00Z')];
  assert.deepEqual(planDirectLedgerWrite(posts, target), { action: 'insert' });
});

test('下書きがあれば予約日時が最も早い 1 件だけを更新する', () => {
  const posts = [row(5, 'draft', '2026-10-20T00:00:00Z'), row(3, 'draft', '2026-10-05T00:00:00Z'), row(9, 'draft', '2026-10-05T00:00:00Z', 'other')];
  assert.deepEqual(planDirectLedgerWrite(posts, target), { action: 'update', id: 3 });
});
