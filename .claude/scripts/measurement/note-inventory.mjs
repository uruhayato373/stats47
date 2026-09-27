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

/**
 * note のダッシュボードが短い集計期間だけ公開記事を一覧に出さない件 (2026-09-21 に 285/286 件で観測) を、
 * 2026-09-27 のオーナー判断で「原因不明の既知の欠け」として許容する。問い合わせはしない。
 * 許容するのは、欠けが記事の欠落だけで・件数が上限以内で・全ページを読み切り・合計が一致する場合に限る。
 * 欠けた記事の値は 0 にせず null のまま残す (既存の棚卸し契約どおり)。
 */
export const NOTE_ACCEPTED_MISSING_ROWS = 1;

export function acceptedNoteGap(snapshot, cover) {
  const coverage = snapshot?.coverage ?? {};
  const missing = coverage.missingFromDashboard?.length ?? Number.POSITIVE_INFINITY;
  const onlyMissingArticles = Array.isArray(snapshot?.issues) && snapshot.issues.length > 0
    && snapshot.issues.every(issue => issue.code === 'catalog_article_missing');
  const coverOk = cover?.status === 'pass'
    || (cover?.status === 'incomplete' && JSON.stringify(cover.issues) === JSON.stringify(['metrics_incomplete']));
  if (snapshot?.status !== 'incomplete' || !onlyMissingArticles || !coverOk) return null;
  if (missing < 1 || missing > NOTE_ACCEPTED_MISSING_ROWS) return null;
  if (coverage.paginationComplete !== true || coverage.totalsMatched !== true) return null;
  return { code: 'note_dashboard_row_hidden', missingRows: missing, acceptedBy: 'owner-2026-09-27' };
}
