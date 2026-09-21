import { articleId, classifyDashboardInventory, METRIC_COLUMNS } from '../note/lib/dashboard-metrics.mjs';

/** Only verified inventory rows may be used; this does not certify a KPI or experiment baseline. */
export function validateNoteInventory(snapshot, cover, now = Date.now()) {
  const mode = classifyDashboardInventory(snapshot);
  if (mode === 'unavailable' || snapshot.account !== 'stats47' || snapshot.schemaVersion !== 2
    || snapshot.coverage?.paginationComplete !== true || snapshot.coverage?.totalsMatched !== true) throw new Error('inventory_metrics_invalid');
  const issues = mode === 'partial' ? ['metrics_incomplete'] : [];
  if (cover?.status !== (mode === 'partial' ? 'incomplete' : 'pass') || JSON.stringify(cover.issues) !== JSON.stringify(issues)
    || cover.metricsFetchedAt !== snapshot.fetchedAt || cover.period?.start !== snapshot.period?.start
    || cover.period?.end !== snapshot.period?.end || cover.period?.timeZone !== 'Asia/Tokyo') throw new Error('inventory_join_invalid');
  for (const timestamp of [snapshot.fetchedAt, cover.coverObservedAt, cover.generatedAt]) {
    const age = now - Date.parse(timestamp);
    if (!Number.isFinite(age) || age < -300000 || age > 86400000) throw new Error('inventory_stale');
  }
  const observed = new Map();
  const allIds = new Set();
  for (const row of snapshot.articles) {
    if (articleId(row.url) !== row.noteId || allIds.has(row.noteId)) throw new Error('inventory_identity_invalid');
    allIds.add(row.noteId);
    if (row.publicationStatus === 'published') observed.set(row.noteId, row);
    else if (row.publicationStatus !== 'private') throw new Error('inventory_identity_invalid');
  }
  const missing = new Set(snapshot.coverage.missingFromDashboard);
  if (missing.size !== snapshot.coverage.missingFromDashboard.length || [...missing].some(id => allIds.has(id))
    || allIds.size !== snapshot.coverage.observed || observed.size !== snapshot.coverage.observedPublished
    || observed.size + missing.size !== snapshot.coverage.catalogPublished) throw new Error('inventory_coverage_invalid');
  const joined = new Set();
  for (const row of cover.articles) {
    if (articleId(row.url) !== row.noteId || joined.has(row.noteId) || !['configured', 'missing'].includes(row.cover?.status)) {
      throw new Error('inventory_identity_invalid');
    }
    joined.add(row.noteId);
    const original = observed.get(row.noteId);
    if (original) {
      if (row.metricsAvailability !== 'observed' || Object.values(METRIC_COLUMNS).some(key =>
        !Number.isSafeInteger(original[key]) || original[key] < 0 || row[key] !== original[key])) throw new Error('inventory_metric_mismatch');
    } else if (!missing.has(row.noteId) || row.metricsAvailability !== 'missing_period_row' || row.baselineEligible !== false
      || Object.values(METRIC_COLUMNS).some(key => row[key] !== null)) throw new Error('inventory_missing_not_null');
  }
  if (joined.size !== observed.size + missing.size || cover.summary?.metricsObserved !== observed.size
    || cover.summary?.metricsMissing !== missing.size || cover.summary?.published !== joined.size) throw new Error('inventory_coverage_invalid');
  return { purpose: 'inventory-only', status: mode, completeForKpi: false, report: {
    ...cover, articles: cover.articles.map(row => ({ ...row, baselineEligible: false })),
  } };
}

export function noteInventoryAvailable(snapshot, cover, now = Date.now()) {
  try { validateNoteInventory(snapshot, cover, now); return true; } catch { return false; }
}
