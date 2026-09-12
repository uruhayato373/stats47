/** note dashboard (2026-09-08以降)。旧viewsとは混ぜない。 */
export const METRIC_COLUMNS = {
  インプレッション: "impressions", ページビュー: "pageViews", スキ: "likes",
  コメント: "comments", 売上: "salesJpy",
};
const DAY = 86_400_000;

export function isoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "") || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`invalid_date: ${value}`);
  }
  return value;
}

export function jstToday(now = new Date().toISOString()) {
  return new Date(Date.parse(now) + 9 * 3_600_000).toISOString().slice(0, 10);
}

export function defaultPeriod(now) {
  const end = new Date(Date.parse(`${jstToday(now)}T00:00:00Z`) - DAY).toISOString().slice(0, 10);
  const start = new Date(Date.parse(`${end}T00:00:00Z`) - 27 * DAY).toISOString().slice(0, 10);
  return { start, end };
}

export function validatePeriod(period, now) {
  isoDate(period.start); isoDate(period.end);
  if (period.start > period.end || period.end >= jstToday(now)) throw new Error("period_not_closed");
  // これ以前はimpressionsの '-' が0でなく未計測になる。
  if (period.start < "2021-05-01") throw new Error("impressions_unavailable_before_2021_05_01");
  return period;
}

export function parseCount(raw) {
  const text = String(raw ?? "").trim().replace(/円$/, "").trim();
  // 現行dashboardでは0はハイフン表示。空欄・未知表記は0にしない。
  if (text === "-") return 0;
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) throw new Error(`invalid_count: ${raw}`);
  const value = Number(text.replaceAll(",", ""));
  if (!Number.isSafeInteger(value)) throw new Error(`unsafe_count: ${raw}`);
  return value;
}

export function articleId(url) {
  const parsed = new URL(url);
  if (parsed.origin !== "https://note.com" || !/^\/stats47\/n\/n[0-9a-f]+$/.test(parsed.pathname) || parsed.search || parsed.hash) {
    throw new Error(`foreign_or_invalid_article: ${url}`);
  }
  return parsed.pathname.split("/").at(-1);
}

function parseDisplayDate(text) {
  const m = text.match(/^(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})日?$/);
  if (!m) throw new Error(`invalid_display_date: ${text}`);
  return isoDate(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`);
}

function parseTimestamp(text) {
  const m = text?.match(/^(\d{4}\/\d{1,2}\/\d{1,2}) (\d{2}:\d{2}) 集計$/);
  if (!m || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(m[2])) throw new Error("aggregation_time_missing_or_invalid");
  return `${parseDisplayDate(m[1])}T${m[2]}:00+09:00`;
}

/** rawはDOMの可視ラベル・値。妥当性が欠ける場合は公開baselineを作らない。 */
export function buildDashboardSnapshot({ raw, catalog, period, now = new Date().toISOString() }) {
  const issues = [];
  const report = {
    schemaVersion: 2, metricDefinition: "note-dashboard-2026-09-08", fetchedAt: now,
    account: "stats47", source: "https://note.com/dashboard", status: "incomplete",
    period: { ...period, timeZone: "Asia/Tokyo", inclusive: true },
    coverage: { complete: false }, issues, articles: [], totals: null,
    limitations: ["pageViewsはカバークリック数ではない", "旧viewsと比較しない", "salesJpyの全体合計は記事以外の売上も含む"],
  };
  try {
    validatePeriod(period, now);
    if (raw.account !== "stats47" || raw.timeZone !== "Asia/Tokyo") throw new Error("account_or_timezone_mismatch");
    const url = new URL(raw.url);
    if (url.origin !== "https://note.com" || url.pathname !== "/dashboard" || url.searchParams.get("period") !== "CUSTOM"
      || url.searchParams.get("date") !== period.start || url.searchParams.get("to") !== period.end) throw new Error("url_period_mismatch");
    const dates = raw.periodText.split(/[〜～]/).map(parseDisplayDate);
    if (dates.length !== 2 || dates[0] !== period.start || dates[1] !== period.end) throw new Error("display_period_mismatch");
    if (raw.periodLabel !== "カスタム") throw new Error("period_label_mismatch");
    const aggregatedAt = parseTimestamp(raw.articleAggregatedAt);
    const summaryAggregatedAt = parseTimestamp(raw.summaryAggregatedAt);
    const endExclusive = Date.parse(`${period.end}T00:00:00+09:00`) + DAY;
    if ([aggregatedAt, summaryAggregatedAt].some(t => Date.parse(t) < endExclusive || Date.parse(t) > Date.parse(now))) {
      throw new Error("aggregation_does_not_cover_period");
    }
    report.period = { ...report.period, label: raw.periodLabel, display: raw.periodText, aggregatedAt, summaryAggregatedAt };
    if (raw.tableCount !== 1 || raw.selectedTab !== "記事") throw new Error("article_table_missing_or_ambiguous");
    if (raw.hasMore !== false || raw.paginationComplete !== true) throw new Error("pagination_incomplete");
    const headers = raw.headers.map(h => h.trim());
    const expected = ["タイトル", ...Object.keys(METRIC_COLUMNS)];
    if (headers.length !== expected.length || new Set(headers).size !== headers.length || expected.some(h => !headers.includes(h))) {
      throw new Error("dashboard_columns_changed");
    }
    if (catalog?.account !== "stats47" || !Array.isArray(catalog.articles)) throw new Error("catalog_invalid");
    const byId = new Map();
    for (const a of catalog.articles) {
      const id = articleId(a.noteUrl);
      if (byId.has(id)) throw new Error(`catalog_duplicate: ${id}`);
      byId.set(id, a);
    }
    const seen = new Set();
    for (const row of raw.rows) {
      const id = articleId(row.url);
      if (seen.has(id)) throw new Error(`duplicate_article: ${id}`);
      seen.add(id);
      if (row.cells.length !== headers.length || !row.title?.trim()) throw new Error(`row_shape_invalid: ${id}`);
      const publishedAt = parseDisplayDate(row.publishedText);
      if (!["公開中", "非公開"].includes(row.statusText)) throw new Error(`unknown_publication_status: ${id}`);
      const publicationStatus = row.statusText === "公開中" ? "published" : "private";
      const meta = byId.get(id);
      if (!meta && publicationStatus === "published") issues.push({ code: "published_not_in_catalog", noteId: id });
      if (meta && publicationStatus !== "published") issues.push({ code: "catalog_publication_mismatch", noteId: id });
      const metrics = Object.fromEntries(Object.entries(METRIC_COLUMNS).map(([label, key]) => [key, parseCount(row.cells[headers.indexOf(label)])]));
      report.articles.push({ noteId: id, url: row.url, title: row.title, publishedAt, publicationStatus,
        catalogKey: meta?.key ?? null, vertical: meta?.vertical ?? null, series: meta?.series ?? null,
        isPaid: meta?.isPaid ?? null, ...metrics, rawCells: Object.fromEntries(headers.map((h, i) => [h, row.cells[i]])),
        fullPeriodExposure: publishedAt <= period.start,
      });
    }
    if (!seen.size) throw new Error("no_articles");
    for (const id of byId.keys()) if (!seen.has(id)) issues.push({ code: "catalog_article_missing", noteId: id });
    const metricKeys = Object.values(METRIC_COLUMNS);
    report.totals = Object.fromEntries(metricKeys.map(key => [key, report.articles.reduce((sum, a) => sum + a[key], 0)]));
    report.dashboardTotals = Object.fromEntries(Object.entries(METRIC_COLUMNS).map(([label, key]) => [key, parseCount(raw.summary[label])]));
    // 売上だけはmembership等を含む全体値と比較しない。
    for (const key of metricKeys.filter(k => k !== "salesJpy")) {
      if (report.totals[key] !== report.dashboardTotals[key]) issues.push({ code: "total_mismatch", metric: key,
        rows: report.totals[key], dashboard: report.dashboardTotals[key] });
    }
    report.coverage = { complete: issues.length === 0, catalogPublished: byId.size, observed: seen.size,
      observedPublished: report.articles.filter(a => a.publicationStatus === "published").length,
      observedPrivate: report.articles.filter(a => a.publicationStatus === "private").length,
      missingFromDashboard: [...byId.keys()].filter(id => !seen.has(id)), paginationComplete: true,
      pages: raw.pages, totalsMatched: !issues.some(i => i.code === "total_mismatch") };
    report.status = issues.length ? "incomplete" : "pass";
  } catch (error) {
    issues.push({ code: "invalid_snapshot", message: error.message });
  }
  return report;
}

/** 状態×実測の一覧。CTRや効果ラベルを捏造せず、制作候補の並び順だけを提供する。 */
export function buildCoverMetricsReport(snapshot, coverAudit, now = new Date().toISOString()) {
  const issues = [];
  const report = { schemaVersion: 1, generatedAt: now, status: "incomplete", issues, articles: [],
    period: snapshot.period, metricsFetchedAt: snapshot.fetchedAt, coverObservedAt: coverAudit?.completedAt,
    ctr: null, ctrUnavailableReason: "表示に対応するカバークリック数を取得していない" };
  const complete = snapshot.status === "pass" && snapshot.coverage?.complete;
  // 一覧に出ない記事だけなら、合計まで検証済みの他の記事は棚卸しに利用できる。
  // 欠けた行を0へ補完せず、全体はincompleteを維持する。
  const missingOnly = snapshot.status === "incomplete" && snapshot.coverage?.paginationComplete
    && snapshot.coverage?.totalsMatched && snapshot.issues?.length > 0
    && snapshot.issues.every(i => i.code === "catalog_article_missing");
  if (!complete && !missingOnly) issues.push("metrics_invalid");
  if (snapshot.account !== "stats47" || snapshot.schemaVersion !== 2) issues.push("metrics_identity_invalid");
  if (coverAudit?.account !== "stats47" || !coverAudit.coverage?.complete || !Array.isArray(coverAudit.articles)) issues.push("cover_audit_incomplete");
  for (const timestamp of [snapshot.fetchedAt, coverAudit?.completedAt]) {
    const age = Date.parse(now) - Date.parse(timestamp);
    if (!Number.isFinite(age) || age < 0 || age > DAY) issues.push("source_stale_or_invalid");
  }
  if (issues.length) return report;
  if (missingOnly) issues.push("metrics_incomplete");
  const byId = new Map(coverAudit.articles.map(a => [a.noteKey, a]));
  if (byId.size !== coverAudit.articles.length) { issues.push("duplicate_cover_article"); return report; }
  for (const a of snapshot.articles.filter(a => a.publicationStatus === "published")) {
    const cover = byId.get(a.noteId)?.cover;
    if (!cover || !["configured", "missing"].includes(cover.status)) issues.push(`cover_unknown:${a.noteId}`);
    const knownCover = ["configured", "missing"].includes(cover?.status);
    report.articles.push({ ...a, metricsAvailability: "observed", cover: cover ?? { status: "unknown" },
      lane: !knownCover ? "investigate" : cover.status === "missing" ? "remediation" : "review_existing",
      baselineEligible: knownCover && a.fullPeriodExposure && a.impressions > 0,
    });
    byId.delete(a.noteId);
  }
  for (const [id, a] of byId) {
    if (!snapshot.coverage.missingFromDashboard.includes(id)) issues.push(`unexpected_cover_article:${id}`);
    const knownCover = ["configured", "missing"].includes(a.cover?.status);
    if (!knownCover) issues.push(`cover_unknown:${id}`);
    report.articles.push({ noteId: id, url: a.noteUrl, title: a.title, catalogKey: a.catalogKey, vertical: a.vertical,
      publicationStatus: "published", publishedAt: null, series: null, isPaid: null,
      ...Object.fromEntries(Object.values(METRIC_COLUMNS).map(key => [key, null])),
      fullPeriodExposure: null, baselineEligible: false, metricsAvailability: "missing_period_row", cover: a.cover,
      lane: !knownCover ? "investigate" : a.cover.status === "missing" ? "remediation" : "review_existing" });
  }
  report.articles.sort((a, b) => (b.impressions ?? -1) - (a.impressions ?? -1) || (b.pageViews ?? -1) - (a.pageViews ?? -1) || a.noteId.localeCompare(b.noteId));
  report.summary = { published: report.articles.length,
    metricsObserved: report.articles.filter(a => a.metricsAvailability === "observed").length,
    metricsMissing: report.articles.filter(a => a.metricsAvailability !== "observed").length,
    remediation: report.articles.filter(a => a.lane === "remediation").length,
    reviewExisting: report.articles.filter(a => a.lane === "review_existing").length,
    partialPeriod: report.articles.filter(a => a.fullPeriodExposure === false).length };
  report.status = issues.length ? "incomplete" : "pass";
  return report;
}

/** UTF-8 CSV。欠測は空欄、0は0。外部由来タイトルを表計算の式として実行させない。 */
export function coverMetricsCsv(report) {
  const columns = { noteId: "記事ID", title: "タイトル", url: "URL", catalogKey: "カタログキー",
    coverStatus: "カバー状態", metricsAvailability: "計測状態", impressions: "インプレッション",
    pageViews: "PV", likes: "スキ", comments: "コメント", salesJpy: "売上（円）",
    baselineEligible: "全期間公開かつ表示あり", start: "開始日（JST）", end: "終了日（JST）" };
  const quote = value => {
    let str = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(str)) str = `'${str}`;
    return `"${str.replaceAll('"', '""')}"`;
  };
  const rows = report.articles.map(a => ({ ...a, coverStatus: a.cover?.status, start: report.period.start, end: report.period.end }));
  return "\uFEFF" + [Object.values(columns), ...rows.map(a => Object.keys(columns).map(k => a[k]))]
    .map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}
