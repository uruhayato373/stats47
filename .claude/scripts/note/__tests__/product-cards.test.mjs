import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePaidProduct, rewriteProductCards } from '../lib/product-cards.mjs';
import { draftSavePayload, preservePublishedIndex, splitPublishedBody } from '../lib/publish-card-body.mjs';

const article = { key: 'sunshine', magazine: 'climate', isPaid: false };
const source = {
  magazines: [{ key: 'climate', paidProductId: 'P-07' }],
  productNotes: [{ productId: 'P-07', canonicalSlug: 'living-pack' }],
  articles: [{ key: 'living-pack', isPaid: true, noteUrl: 'https://note.com/stats47/n/n323af74c09cc', title: '気候・住まいデータ集' }],
};

test('resolve the paid note from the product mapping and publication ledger', () => {
  assert.equal(resolvePaidProduct(article, source).noteUrl, source.articles[0].noteUrl);
});

test('an unpublished or free replacement cannot become a paid product CTA', () => {
  assert.throws(() => resolvePaidProduct(article, { ...source, articles: [] }), /published paid note missing/);
  assert.throws(() => resolvePaidProduct(article, { ...source, articles: [{ ...source.articles[0], isPaid: false }] }), /published paid note missing/);
});

test('replace the old shop card without removing the preceding next-article card', () => {
  const head = '<h2 id="h">次に読む</h2><p id="next">次の記事</p><figure embedded-service="note" data-src="https://note.com/stats47/n/n023501038bd5" embedded-content-key="embNext"></figure>';
  const sales = '<p id="sales"><strong>このテーマをまとめて読む・使う</strong><br>Kindle本またはデータ集</p><figure id="f" data-src="https://stats47.jp/products/data-p-07/from/note/nf962c6702b93" embedded-service="external-article" embedded-content-key="embOld"></figure>';
  const result = rewriteProductCards(head + sales, resolvePaidProduct(article, source));
  assert.ok(result.startsWith(head));
  assert.ok(result.includes('id="sales"'));
  assert.ok(result.includes('id="f"'));
  assert.ok(result.includes(source.articles[0].noteUrl));
  assert.ok(!result.includes('/products/data-p-07'));
  assert.ok(!result.includes('Kindle本'));
  assert.equal(rewriteProductCards(result, resolvePaidProduct(article, source)), result);
});

test('restore a temporary draft with the boolean index required by the native API', () => {
  const draft = { body: '<p>未公開の編集</p>', name: '編集', index: [] };
  const payload = draftSavePayload(draft);
  assert.equal(payload.index, false);
  assert.equal(payload.body_length, 6);
  assert.equal(payload.body, draft.body);
  assert.ok(!Object.hasOwn(payload, 'separator'));
});

test('a draft with a table of contents cannot enable it on a publication that has none', () => {
  const payload = {index:true,free_body:'approved body',price:0};
  assert.deepEqual(preservePublishedIndex(payload,{index:[]}),{...payload,index:false});
  assert.equal(preservePublishedIndex({index:false},{index:[{body:'見出し'}]}).index,true);
  assert.equal(draftSavePayload({body:'<h2>見出し</h2>',name:'draft',index:[{body:'見出し'}]}).index,true);
  assert.throws(()=>preservePublishedIndex({index:[]},{index:[]}),/not boolean/);
});

test('paid card repair retains the original separator and all paid content', () => {
  const free = '<p id="s">無料部分</p>';
  const paid = '<p>購入者用の本文</p>';
  const before = { body: free + paid, price: 500, separator: 's' };
  assert.deepEqual(splitPublishedBody(before, { body: free }, free + paid), { free_body: free, pay_body: paid });
  assert.throws(() => splitPublishedBody(before, { body: '<p>違う</p>' }, before.body), /prefix mismatch/);
});
