import assert from 'node:assert/strict';
import test from 'node:test';
import { validateArticleLedger } from '../lib/article-ledger.mjs';

const magazines = { schemaVersion: 1, magazines: [{ key: 's47-test', name: 'm', isPaid: false, description: 'd', verticals: ['stats47-note'], noteUrl: null }] };
const article = (over = {}) => ({
  key: 'a-test', vertical: 'stats47-note', title: 't', magazine: 's47-test', isPaid: false, status: 'draft',
  r2Path: 'note/stats47-note/a-test', body: { store: 'r2-public', manifest: null }, ...over,
});
const ledger = (...articles) => ({ schemaVersion: 1, account: 'stats47', articles });
test('paid articles cannot be stored in the public bucket and keys must be unique', () => {
  assert.throws(() => validateArticleLedger(ledger(article({ isPaid: true, priceJpy: 300 })), magazines), /schema/);
  assert.throws(() => validateArticleLedger(ledger(article(), article()), magazines), /duplicate key/);
});
