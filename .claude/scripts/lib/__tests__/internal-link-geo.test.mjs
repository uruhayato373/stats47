import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractInternalLinks, lintInternalLinks } from '../internal-link-lint.mjs';

test('Geo canonical・方法・県途中データの3リンクを数える', () => {
  const text = '[分析](/geo/population-land-price)\n[方法](https://stats47.jp/geo/method)\n<source-link href="/geo/data/population-land-price/13">検算</source-link>';
  assert.deepEqual(extractInternalLinks(text).map((l) => l.href), [
    '/geo/data/population-land-price/13', '/geo/population-land-price', '/geo/method',
  ]);
  assert.equal(extractInternalLinks('[外部](https://other.example/geo/method)').length, 0);
});

test('存在しないGeo slug・県・途中段階はblockerにする', () => {
  for (const path of ['/geo/missing', '/geo/data/population-land-price/48', '/geo/population-flood-risk/13/missing']) {
    assert.equal(lintInternalLinks(`[検証](${path})`).blockers.length, 1);
  }
  assert.equal(lintInternalLinks('[検証](/geo/data/population-land-price/13)').blockers.length, 0);
});

test('市区町村ランキング: 公開中の key と県別対象の県別 URL は通す', () => {
  const text = [
    '[全国](/municipalities/ranking/fiscal-strength-index)',
    '<source-link href="https://stats47.jp/municipalities/ranking/fiscal-strength-index/13000">東京都</source-link>',
    '[公開中の非県別 key](/municipalities/ranking/total-population)',
    '[テーマは対象外](/municipalities/themes/whatever)',
  ].join('\n');
  const result = lintInternalLinks(text);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.stats.internalLinksChecked, 3);
});

test('市区町村ランキング: 存在しない key・県別対象外の key・47 県外のコードは blocker にする', () => {
  for (const path of [
    '/municipalities/ranking/no-such-municipality-metric',
    '/municipalities/ranking/no-such-municipality-metric/13000',
    '/municipalities/ranking/total-population/13000',
    '/municipalities/ranking/fiscal-strength-index/48000',
    '/municipalities/ranking/fiscal-strength-index/13',
    '/municipalities/ranking/fiscal-strength-index/13000/extra',
  ]) {
    const result = lintInternalLinks(`[検証](${path})`);
    assert.equal(result.blockers.length, 1, path);
    assert.match(result.blockers[0], /municipalities\/ranking/);
  }
});
