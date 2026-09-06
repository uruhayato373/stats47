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
