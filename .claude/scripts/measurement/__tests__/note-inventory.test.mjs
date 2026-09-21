import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { buildCoverMetricsReport } from '../../note/lib/dashboard-metrics.mjs';
import { noteInventoryAvailable, validateNoteInventory } from '../note-inventory.mjs';
import { validateAttempt, validateEvidence, validateInventoryAttempt } from '../consumer-paths.mjs';
import { SOURCES } from '../sources.mjs';
import { measurementHealth } from '../health.mjs';

const time = '2026-09-21T05:00:00Z';
const now = Date.parse(time);
function fixture() {
  const snapshot = { schemaVersion: 2, account: 'stats47', status: 'incomplete', fetchedAt: time,
    period: { start: '2026-08-24', end: '2026-09-20', timeZone: 'Asia/Tokyo' },
    issues: [{ code: 'catalog_article_missing', noteId: 'na2' }],
    coverage: { complete: false, paginationComplete: true, totalsMatched: true, catalogPublished: 2,
      observed: 1, observedPublished: 1, observedPrivate: 0, missingFromDashboard: ['na2'] },
    articles: [{ noteId: 'na1', url: 'https://note.com/stats47/n/na1', publicationStatus: 'published',
      fullPeriodExposure: true, impressions: 10, pageViews: 3, likes: 0, comments: 0, salesJpy: 0 }] };
  const covers = { account: 'stats47', coverage: { complete: true }, completedAt: time,
    articles: ['na1', 'na2'].map(id => ({ noteKey: id, noteUrl: `https://note.com/stats47/n/${id}`, cover: { status: 'configured' } })) };
  return { snapshot, cover: buildCoverMetricsReport(snapshot, covers, time) };
}
const attempt = { source: 'note', capability: SOURCES.note.capability, observedAt: time,
  status: 'failed', code: 'report_incomplete', metricsAvailable: false, inventoryAvailable: true };

test('partial inventory retains null, observed zero and never certifies a KPI or baseline', () => {
  const { snapshot, cover } = fixture();
  const result = validateNoteInventory(snapshot, cover, now);
  assert.equal(result.status, 'partial');
  assert.equal(result.completeForKpi, false);
  assert.equal(result.report.status, 'incomplete');
  assert.equal(result.report.articles.find(row => row.noteId === 'na1').likes, 0);
  assert.equal(result.report.articles.find(row => row.noteId === 'na2').likes, null);
  assert.ok(result.report.articles.every(row => row.baselineEligible === false));
  assert.equal(cover.articles[0].baselineEligible, true, 'validation must not mutate source evidence');
  validateInventoryAttempt(attempt, now);
  assert.throws(() => validateAttempt(attempt, now, 'note'), /not_successful/);
  const health = measurementHealth({ generatedAt: time, sources: [attempt] }, now);
  assert.equal(health.status, 'action_required');
  assert.equal(health.sources.find(row => row.source === 'note').metricsAvailable, false);
  assert.equal(health.sources.find(row => row.source === 'note').inventoryAvailable, true);
});
test('wrong identity, totals, pagination, stale input and inconsistent missing rows are unavailable', () => {
  for (const mutate of [
    f => { f.snapshot.account = 'other'; },
    f => { f.snapshot.coverage.totalsMatched = false; },
    f => { f.snapshot.coverage.paginationComplete = false; },
    f => { f.snapshot.issues.push({ code: 'published_not_in_catalog' }); },
    f => { f.cover.coverObservedAt = '2026-09-18T00:00:00Z'; },
    f => { f.cover.period = { ...f.cover.period, start: '2026-08-25' }; },
    f => { f.cover.articles[0].url = 'https://note.com/other/n/na1'; },
    f => { f.cover.articles[0].cover.status = 'unknown'; },
    f => { f.cover.articles[0].pageViews = 0; },
    f => { f.cover.articles.find(row => row.noteId === 'na2').pageViews = 0; },
    f => { f.cover.articles.pop(); },
    f => { f.cover.articles.push(f.cover.articles[0]); },
    f => { f.cover.summary.metricsMissing = 0; },
    f => { f.snapshot.coverage.catalogPublished = 3; },
  ]) {
    const f = fixture(); mutate(f);
    assert.equal(noteInventoryAvailable(f.snapshot, f.cover, now), false);
  }
  assert.equal(noteInventoryAvailable(...Object.values(fixture()), now + 2 * 86400000), false);
});
test('latest failed or stale attempt cannot fall back to an old successful inventory', () => {
  for (const value of [null, { ...attempt, source: 'gsc' }, { ...attempt, code: 'auth_required' },
    { ...attempt, code: 'storage_error' }, { ...attempt, inventoryAvailable: false },
    { ...attempt, observedAt: '2026-09-17T00:00:00Z' }, { ...attempt, capability: 'old' }]) {
    assert.throws(() => validateInventoryAttempt(value, now));
  }
  const evidence = { source: 'note', observedAt: time, files: {} };
  const tied = { ...attempt, evidence: { sha256: createHash('sha256').update(JSON.stringify(evidence)).digest('hex') } };
  validateEvidence(tied, evidence, 'note');
  for (const value of [null, { ...evidence, observedAt: '2026-09-20T00:00:00Z' },
    { ...evidence, source: 'gsc' }, { ...evidence, files: { other: 'old' } }]) {
    assert.throws(() => validateEvidence(tied, value, 'note'), /evidence_attempt_mismatch/);
  }
});
