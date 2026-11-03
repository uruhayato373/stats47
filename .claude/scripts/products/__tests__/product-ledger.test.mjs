import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLedger, collectProducts, lineOf, noteNetYen, renderLedgerMarkdown } from '../lib/product-ledger.mjs';

const fee = { cardProcessingRate: 0.05, platformRate: 0.1 };
const line = (id, match, extra = {}) => ({ id, name: id, stance: 'keep', nextReviewOn: '2026-12-30', match, ...extra });
const strategy = {
  fees: { note: fee },
  lines: [
    line('pack', { channel: 'note', status: ['published'], vertical: 'product-sales', maxYen: 3000 }),
    line('note', { channel: 'note', status: ['published'] }),
    line('kdp', { channel: 'kdp', status: ['live'] }),
  ],
  decisions: [{ date: '2026-11-04', topic: '価格', decision: '下げる' }],
  agenda: [{ topic: '導線', question: 'どこから来るか', evidenceNeeded: 'クリック' }],
};
const articles = [
  { key: 'a', title: 'A', isPaid: true, priceJpy: 1980, status: 'published', vertical: 'product-sales', noteUrl: 'https://note.com/stats47/n/n1' },
  { key: 'free', title: 'F', isPaid: false, status: 'published' },
  { key: 'b', title: 'B', isPaid: true, priceJpy: 300, status: 'draft', noteUrl: null },
];
const listings = { 'K-1': { id: 'K-1', title: 'K', priceYen: 800, publicationStage: 'live' } };
const priceHistory = { experiments: [{ id: 'PRICE-A', status: 'running', reviewOn: '2026-11-01' }], changes: [{ productKey: 'a', fromYen: 5000, toYen: 1980, status: 'applied', appliedAt: 'x' }] };

const build = () => buildLedger({
  strategy,
  products: collectProducts({ articles, listings }),
  dashboard: { period: { start: 's', end: 'e' }, articles: [{ noteId: 'n1', pageViews: 7, salesJpy: 0 }] },
  salesObservations: [{ channel: 'kdp', productId: 'K-1', units: 2, netRevenueYen: 413 }],
  priceHistory,
  asOf: '2026-11-04',
});

test('有料の商品だけを読み、価格は元の台帳の値を使う', () => {
  const products = collectProducts({ articles, listings });
  assert.deepEqual(products.map((p) => [p.channel, p.key, p.priceYen]), [['note', 'a', 1980], ['note', 'b', 300], ['kdp', 'K-1', 800]]);
});

test('商品群は上から最初に当たったものにし、当たらなければ null', () => {
  assert.equal(lineOf(strategy.lines, { channel: 'note', status: 'published', vertical: 'product-sales', priceYen: 1980 }), 'pack');
  assert.equal(lineOf(strategy.lines, { channel: 'note', status: 'published', vertical: 'product-sales', priceYen: 4980 }), 'note');
  assert.equal(lineOf(strategy.lines, { channel: 'kdp', status: 'withdrawn', priceYen: 500 }), null);
});

test('どの商品群にも入らない商品を未分類として出す', () => {
  assert.deepEqual(build().unassigned, ['note:b']);
});

test('note の手取りは事務手数料を引いた額に利用料をかける', () => {
  assert.equal(noteNetYen(1980, fee), 1692);
  assert.equal(noteNetYen(4980, fee), 4257);
});

test('測れない閲覧は 0 にせず null のままにする', () => {
  const ledger = build();
  assert.equal(ledger.products.find((p) => p.key === 'K-1').pageViews, null);
  assert.equal(ledger.lines.find((l) => l.id === 'kdp').pageViews, null);
  assert.equal(ledger.lines.find((l) => l.id === 'kdp').salesYen, 413);
  assert.equal(ledger.products.find((p) => p.key === 'a').pageViews, 7);
});

test('価格の変更と判定の期日が台帳と要約に出る', () => {
  const ledger = build();
  assert.deepEqual(ledger.products.find((p) => p.key === 'a').lastPriceChange, { fromYen: 5000, toYen: 1980, appliedAt: 'x' });
  assert.equal(ledger.experiments[0].due, true);
  const md = renderLedgerMarkdown(ledger, strategy);
  assert.match(md, /判定の期日が来た価格実験\*\*: PRICE-A/);
  assert.match(md, /導線/);
  assert.match(md, /未計測/);
});
