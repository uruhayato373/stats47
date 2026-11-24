import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareSource, decodeHtml, fingerprint, latestYearMentioned, normalizeHtml, sourceWatchUrl } from '../lib/source-watch.mjs';

const page = (body) => fingerprint({ body: Buffer.from(`<html><body>${body}</body></html>`), contentType: 'text/html' });

test('索引ページの URL を PDF より優先する', () => {
  const url = sourceWatchUrl({ url: 'https://a.example/top', config: { provenance: { publicationIndexUrl: 'https://a.example/index', pdfUrl: 'https://a.example/x.pdf' } } });
  assert.equal(url, 'https://a.example/index');
});

test('和暦も西暦の年に直して最新の年を返す', () => {
  assert.equal(latestYearMentioned('令和7年版 2023年の値'), 2025);
  assert.equal(latestYearMentioned('平成元年'), 1989);
  assert.equal(latestYearMentioned('番号 2023 のみ'), null);
});

test('script の変化では指紋が変わらない', () => {
  assert.equal(normalizeHtml('<p>本文</p><script>var a=1</script>'), '本文');
  assert.equal(page('本文<script>1</script>').hash, page('本文<script>2</script>').hash);
});

test('新しい年の版が増えたら newer-year、本文だけなら content を返す', () => {
  const before = compareSource(null, { ok: true, status: 200, ...page('令和6年版') }, 't0').entry;
  assert.equal(compareSource(before, { ok: true, status: 200, ...page('令和6年版') }, 't1').kind, 'same');
  assert.equal(compareSource(before, { ok: true, status: 200, ...page('令和7年版') }, 't1').kind, 'newer-year');
  assert.equal(compareSource(before, { ok: true, status: 200, ...page('令和6年版 お知らせ') }, 't1').kind, 'content');
});

test('取得に失敗しても前回の指紋を残し、失敗の始まりを保つ', () => {
  const before = compareSource(null, { ok: true, status: 200, ...page('令和6年版') }, 't0').entry;
  const failed = compareSource(before, { ok: false, status: 404 }, 't1');
  const again = compareSource(failed.entry, { ok: false, status: 404 }, 't2');
  assert.equal(again.kind, 'unreachable');
  assert.equal(again.entry.hash, before.hash);
  assert.equal(again.entry.failedSince, 't1');
  assert.equal(compareSource(again.entry, { ok: true, status: 200, ...page('令和6年版') }, 't3').entry.failedSince, undefined);
});

test('Shift_JIS のページでも和暦の年を読める', () => {
  const body = Buffer.from(new Uint8Array([0x3c, 0x6d, 0x65, 0x74, 0x61, 0x20, 0x63, 0x68, 0x61, 0x72, 0x73, 0x65, 0x74, 0x3d, 0x53, 0x68, 0x69, 0x66, 0x74, 0x5f, 0x4a, 0x49, 0x53, 0x3e, 0x97, 0xdf, 0x98, 0x61, 0x37, 0x94, 0x4e]));
  assert.equal(decodeHtml(body, 'text/html').endsWith('令和7年'), true);
  assert.equal(fingerprint({ body, contentType: 'text/html' }).latestYear, 2025);
});
