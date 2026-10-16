import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeAll } from '../normalize.mjs';
import { ALL_SOURCES } from '../lib/sources.mjs';
import { createObservation } from '../lib/contracts.mjs';
import { analyze } from '../analyze.mjs';

const now = '2026-10-17T00:00:00Z';
function fixture(t, source, summary) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-period-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'data', source, 'snapshots', '2026-W41');
  fs.mkdirSync(dir, { recursive: true });
  const csv = source === 'gsc'
    ? 'page,clicks,impressions,ctr,position\nhttps://stats47.jp/blog/roadside-station,17,8407,0.002,8\n'
    : 'pagePath,screenPageViews,activeUsers,engagementRate\n/blog/roadside-station,92,40,0.5\n';
  fs.writeFileSync(path.join(dir, 'pages.csv'), csv);
  if (summary) fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary));
  return normalizeAll({ root, now, sources: ALL_SOURCES.filter((s) => s.name === source) });
}
const generatedAt = '2026-10-15T22:55:06.877Z';
const rolling28d = { periodStart: '2026-09-11', periodEnd: '2026-10-08', isFinalized: true, coverage: { status: 'complete' } };

test('GSC 28日・取得遅延: 8407/17を実期間と取得日時で候補へ引き継ぐ、承認状態を保持', (t) => {
  const r = fixture(t, 'gsc', { generatedAt, rolling28d, finalized7d: { periodStart: '2026-10-02', periodEnd: '2026-10-08' } });
  const o = r.observations.find((o) => o.metric === 'impressions');
  assert.equal(o.value, 8407);
  assert.equal(o.periodStart, '2026-09-11');
  assert.equal(o.periodEnd, '2026-10-08');
  assert.equal(o.observedAt, generatedAt);
  assert.equal(o.isFinalized, true);
  assert.match(o.provenance.metadataFile, /summary.json$/);
  const first = analyze({ observations: r.observations, now });
  const c = first.candidates.find((c) => c.type === 'ctr-opportunity');
  assert.deepEqual(c.baselinePeriod, { start: '2026-09-11', end: '2026-10-08' });
  assert.equal(c.evidence.find((e) => e.metric === 'impressions').observedAt, generatedAt);
  const next = analyze({ observations: r.observations, now, prevCandidates: [{ ...c, status: 'approved', approvedAt: generatedAt }] });
  assert.equal(next.candidates.find((x) => x.id === c.id).status, 'approved');
  assert.equal(next.candidates.find((x) => x.id === c.id).approvedAt, generatedAt);
});
test('週名ではなく明示された7日report期間を使う', (t) => {
  const r = fixture(t, 'gsc', { generatedAt, rolling28d: { ...rolling28d, periodStart: '2026-10-02' } });
  assert.equal(r.observations[0].periodStart, '2026-10-02');
});
test('summary欠落は未取得、期間/確定性欠落はnull・partialで扱う', (t) => {
  assert.equal(fixture(t, 'gsc', null).sources.gsc.status, 'missing');
  const r = fixture(t, 'gsc', { generatedAt });
  assert.equal(r.observations[0].periodStart, null);
  assert.equal(r.observations[0].isFinalized, null);
  assert.equal(r.observations[0].freshness, 'partial');
});
test('旧GA4 rawページはrolling28日終端を復元するが確定済みとはしない', (t) => {
  const r = fixture(t, 'ga4', { generatedAt, jpFinalized7d: { periodStart: '2026-10-04', periodEnd: '2026-10-10', isFinalized: true } });
  assert.equal(r.observations[0].periodStart, '2026-09-13');
  assert.equal(r.observations[0].periodEnd, '2026-10-10');
  assert.equal(r.observations[0].isFinalized, null);
  assert.equal(r.sources.ga4.freshness, 'partial');
});
test('混在期間・欠落期間を単一baselineへ拡張/合成しない', () => {
  for (const periodStart of ['2026-10-02', null]) {
    const observations = [['impressions', 8407], ['ctr', 0.002], ['position', 8]].map(([metric, value]) => createObservation({
      source: 'gsc', metric, value, dimensions: { page: '/ranking/example' }, observedAt: generatedAt,
      ...rolling28d, ...(metric === 'ctr' ? { periodStart } : {}),
    }));
    const c = analyze({ observations, now }).candidates.find((c) => c.type === 'ctr-opportunity');
    assert.equal(c.baselinePeriod, null);
    assert.ok(c.limitations.some((s) => s.includes('集計期間')));
  }
});
