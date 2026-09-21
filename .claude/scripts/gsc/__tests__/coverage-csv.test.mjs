import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCoverageDrilldown } from '../lib/coverage-csv.mjs';

test('coverage queue preserves quoted URLs and crawl dates without dropping observations', () => {
  const rows = parseCoverageDrilldown('URL,前回のクロール\n"https://stats47.jp/?a=1,2",2026-09-18\nhttps://stats47.jp/,\n', 'crawled-not-indexed');
  assert.deepEqual(rows, [
    {url: 'https://stats47.jp/?a=1,2', category: 'crawled-not-indexed', lastCrawl: '2026-09-18'},
    {url: 'https://stats47.jp/', category: 'crawled-not-indexed', lastCrawl: ''},
  ]);
  assert.throws(() => parseCoverageDrilldown('URL,前回のクロール\nnot-a-url,\n', 'test'));
  assert.throws(() => parseCoverageDrilldown('URL,other\nhttps://stats47.jp/,\n', 'test'));
  assert.match(readFileSync('.claude/scripts/gsc/build-coverage-queue.mjs', 'utf8'), /rows\.push\(\.\.\.parseCoverageDrilldown\(text, category\)\)/);
});
