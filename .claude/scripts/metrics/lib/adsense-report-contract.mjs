/**
 * adsense-report-contract — AdSense Management API v2 の job 別 dimension/metric 互換契約 (pure)。
 *
 * 正典: docs/02_実装計画/41_AdSense継続改善・GA4_GSC設定自動化仕様.md §4.2。
 *
 * - job ごとに要求してよい dimensions / metrics を固定する (全 metric を全 dimension に投げない)。
 *   unit/format/placement 系では PAGE_VIEWS / PAGE_VIEWS_RPM が 0 になり比較指標にできないため
 *   要求しない (§2.2)。主指標は IMPRESSIONS_RPM。
 * - 公式 COST_PER_CLICK / IMPRESSIONS_RPM / AD_REQUESTS / AD_REQUESTS_COVERAGE を取得する (§2.1)。
 * - 各 job の結果は manifest (schemaVersion 2・期間 metadata・status・limitations) で保存する。
 *   PAGE_URL の 0 行は privacy-threshold であり、error や 0 PV と混同しない (§2.3)。
 * - currency / timeZone は API response から取れた場合だけ確定値にする。取れなければ
 *   "unknown" + limitation (§4.2 末尾)。
 *
 * pure module (I/O なし)。テスト: __tests__/adsense-contract.test.mjs
 */

export const ADSENSE_MANIFEST_SCHEMA_VERSION = 2;
export const ADSENSE_SOURCE = "adsense-management-api-v2";
export const MANIFEST_FILE = "manifest.json";

/** account KPI / device で使う全 metric (§4.2)。 */
export const METRICS_FULL = Object.freeze([
  "ESTIMATED_EARNINGS",
  "PAGE_VIEWS",
  "PAGE_VIEWS_RPM",
  "IMPRESSIONS",
  "IMPRESSIONS_RPM",
  "CLICKS",
  "IMPRESSIONS_CTR",
  "COST_PER_CLICK",
  "ACTIVE_VIEW_VIEWABILITY",
  "AD_REQUESTS",
  "AD_REQUESTS_COVERAGE",
]);

/** unit/format/placement/bid-type 等 PAGE_VIEWS が意味を持たない job 用 (§2.2)。 */
export const METRICS_IMPRESSION_BASED = Object.freeze(
  METRICS_FULL.filter((m) => m !== "PAGE_VIEWS" && m !== "PAGE_VIEWS_RPM"),
);

/**
 * job 契約 (§4.2 の表)。file 名は既存 snapshot 形式を維持しつつ新 job を追加する。
 * periodKind: finalized7d が既定。pages のみ privacy threshold 回避のため 30 日窓 (後方互換 legacy・ADSENSE-PAGES-DATA-01)。
 */
export const REPORT_JOBS = Object.freeze([
  { name: "overview", file: "overview.csv", dimensions: [], metrics: METRICS_FULL, periodKind: "finalized7d" },
  { name: "daily", file: "daily.csv", dimensions: ["DATE"], metrics: METRICS_FULL, periodKind: "finalized7d" },
  { name: "devices", file: "devices.csv", dimensions: ["PLATFORM_TYPE_CODE", "PLATFORM_TYPE_NAME"], metrics: METRICS_FULL, periodKind: "finalized7d" },
  { name: "units", file: "units.csv", dimensions: ["AD_UNIT_ID", "AD_UNIT_NAME"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  { name: "formats-platforms", file: "formats-platforms.csv", dimensions: ["AD_FORMAT_CODE", "PLATFORM_TYPE_CODE"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  { name: "placements-platforms", file: "placements-platforms.csv", dimensions: ["AD_PLACEMENT_CODE", "PLATFORM_TYPE_CODE"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  { name: "bid-types-platforms", file: "bid-types-platforms.csv", dimensions: ["BID_TYPE_CODE", "PLATFORM_TYPE_CODE"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  { name: "traffic-sources", file: "traffic-sources.csv", dimensions: ["TRAFFIC_SOURCE_CODE"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  { name: "countries", file: "countries.csv", dimensions: ["COUNTRY_CODE"], metrics: METRICS_IMPRESSION_BASED, periodKind: "finalized7d" },
  // PAGE_URL はプライバシー閾値で 7 日窓は常に 0 行のため 30 日窓 (ADSENSE-PAGES-DATA-01 継承)。
  { name: "pages", file: "pages.csv", dimensions: ["PAGE_URL"], metrics: METRICS_FULL, periodKind: "rolling30d", windowDays: 30 },
]);

/** job 名 → 契約。未知 job は throw (契約外の組合せを黙って投げない)。 */
export function jobByName(name) {
  const job = REPORT_JOBS.find((j) => j.name === name);
  if (!job) throw new Error(`unknown adsense report job: ${String(name)}`);
  return job;
}

/**
 * job の実行結果を status に分類する (§4.2)。
 * - error があれば "error"
 * - PAGE_URL 0 行は "privacy-threshold" (エラーや 0 PV と扱わない・§2.3)
 * - それ以外の 0 行は "missing"
 * - 行があり日別 job で期間内の日付が欠けるなら "partial" (呼び元が missingDates を渡す)
 */
export function classifyJobStatus(job, rowCount, { error = null, missingDates = [] } = {}) {
  if (error) return "error";
  if (rowCount === 0) {
    return job.dimensions.includes("PAGE_URL") ? "privacy-threshold" : "missing";
  }
  if (missingDates.length > 0) return "partial";
  return "complete";
}

/**
 * manifest entry (§4.2 の JSON 契約) を組み立てる。
 * currencyCode / timeZone は確定値が無ければ "unknown" とし limitation を付ける。
 */
export function buildJobManifest({
  job,
  period,
  rowCount,
  status,
  generatedAt,
  currencyCode = null,
  timeZone = null,
  limitations = [],
  error = null,
}) {
  const lim = [...limitations];
  if (!currencyCode) lim.push("currencyCode を API response から取得できず unknown (環境から推定した確定値を書かない)");
  if (!timeZone) lim.push("timeZone を API response から取得できず unknown");
  if (status === "privacy-threshold") {
    lim.push("PAGE_URL はプライバシー閾値未満のため 0 行 (エラーではない・ページ別収益を捏造しない)");
  }
  if (job.name === "pages") {
    lim.push("pages のみ 30 日窓 (7 日窓は全ページ閾値未満・ADSENSE-PAGES-DATA-01)");
  }
  lim.push("ESTIMATED_EARNINGS は推定値 (月次確定まで変動しうる)");
  if (error) lim.push(`API error: ${String(error).slice(0, 200)}`);
  return {
    schemaVersion: ADSENSE_MANIFEST_SCHEMA_VERSION,
    source: ADSENSE_SOURCE,
    periodKind: job.periodKind,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    windowDays: job.windowDays ?? period.windowDays,
    isFinalized: job.periodKind === "finalized7d",
    generatedAt,
    currencyCode: currencyCode ?? "unknown",
    timeZone: timeZone ?? "unknown",
    dimensions: [...job.dimensions],
    metrics: [...job.metrics],
    rowCount,
    status,
    limitations: lim,
  };
}

/**
 * AdSense v2 ReportResult の headers から currencyCode を抽出する (monetary metric header に付く)。
 * 取れなければ null。
 */
export function currencyFromHeaders(headers) {
  if (!Array.isArray(headers)) return null;
  for (const h of headers) {
    if (h && typeof h.currencyCode === "string" && h.currencyCode) return h.currencyCode;
  }
  return null;
}

// ── history schema v2 (公式 CPC と後方互換 legacy 収益/click の分離・§2.1) ──────────

/** account history.csv v2: 公式 metric 列を追加 (過去行は空 = null 扱い。0 で埋めない)。 */
export const ADSENSE_HISTORY_FIELDS_V2 = Object.freeze([
  "week",
  "earnings",
  "page_views",
  "rpm",
  "impressions",
  "impressions_rpm",
  "clicks",
  "ctr",
  "viewability",
  "cost_per_click",
  "ad_requests",
  "ad_requests_coverage",
]);

/** device history v2: cpc (earnings/clicks) を後方互換の legacy 列へ改名し、公式 cost_per_click を別列で持つ。 */
export const ADSENSE_DEVICE_FIELDS_V2 = Object.freeze([
  "week",
  "platform",
  "earnings",
  "page_views",
  "rpm",
  "impressions",
  "impressions_rpm",
  "clicks",
  "ctr",
  "viewability",
  "cost_per_click",
  "earnings_per_click_legacy",
  "imp_per_pv",
]);

/**
 * account history 行を v2 へ移行する (値は保全)。公式列が無い過去行は "" (null 意味)。
 * @returns {{rows:object[], migrated:boolean}}
 */
export function migrateAdsenseHistoryRows(rows) {
  let migrated = false;
  const out = rows.map((r) => {
    if (r.cost_per_click !== undefined) return r;
    migrated = true;
    return {
      ...r,
      impressions_rpm: r.impressions_rpm ?? "",
      cost_per_click: "",
      ad_requests: "",
      ad_requests_coverage: "",
    };
  });
  return { rows: out, migrated };
}

/**
 * device history 行を v2 へ移行する。旧 `cpc` (earnings/clicks) は
 * `earnings_per_click_legacy` へ改名 (値は保全)。公式 cost_per_click が無い過去行は ""。
 */
export function migrateAdsenseDeviceRows(rows) {
  let migrated = false;
  const out = rows.map((r) => {
    if (r.earnings_per_click_legacy !== undefined) return r;
    migrated = true;
    const { cpc, ...rest } = r;
    return {
      ...rest,
      impressions_rpm: r.impressions_rpm ?? "",
      cost_per_click: "",
      earnings_per_click_legacy: cpc ?? "",
    };
  });
  return { rows: out, migrated };
}

const numOrEmpty = (v) => {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

/**
 * overview.csv の 1 行 (新旧どちらの列構成でも) から account history v2 行を作る。
 * 公式 metric 列が snapshot に無ければ "" (null 意味・0 補完しない)。
 */
export function adsenseHistoryRowFromOverview(week, r) {
  const n = (v, digits) => {
    const x = numOrEmpty(v);
    return x === "" ? (digits !== undefined ? "" : 0) : digits !== undefined ? x.toFixed(digits) : x;
  };
  return {
    week,
    earnings: Number(r.ESTIMATED_EARNINGS ?? 0).toFixed(2),
    page_views: Number(r.PAGE_VIEWS ?? 0),
    rpm: Number(r.PAGE_VIEWS_RPM ?? 0).toFixed(3),
    impressions: Number(r.IMPRESSIONS ?? 0),
    impressions_rpm: n(r.IMPRESSIONS_RPM, 2),
    clicks: Number(r.CLICKS ?? 0),
    ctr: Number(r.IMPRESSIONS_CTR ?? 0).toFixed(4),
    viewability: Number(r.ACTIVE_VIEW_VIEWABILITY ?? 0).toFixed(4),
    cost_per_click: n(r.COST_PER_CLICK, 2),
    ad_requests: numOrEmpty(r.AD_REQUESTS),
    ad_requests_coverage: n(r.AD_REQUESTS_COVERAGE, 4),
  };
}

/** devices.csv の 1 行から device history v2 行を作る。後方互換の legacy 収益/click は明示列で保持。 */
export function adsenseDeviceRowFromSnapshot(week, d) {
  const earnings = Number(d.ESTIMATED_EARNINGS ?? 0);
  const pv = Number(d.PAGE_VIEWS ?? 0);
  const imp = Number(d.IMPRESSIONS ?? 0);
  const clicks = Number(d.CLICKS ?? 0);
  const cpcOfficial = numOrEmpty(d.COST_PER_CLICK);
  return {
    week,
    platform: d.PLATFORM_TYPE_NAME || d.PLATFORM_TYPE_CODE || "unknown",
    earnings: earnings.toFixed(2),
    page_views: pv,
    rpm: Number(d.PAGE_VIEWS_RPM ?? 0).toFixed(2),
    impressions: imp,
    impressions_rpm: numOrEmpty(d.IMPRESSIONS_RPM) === "" ? "" : Number(d.IMPRESSIONS_RPM).toFixed(2),
    clicks,
    ctr: Number(d.IMPRESSIONS_CTR ?? 0).toFixed(4),
    viewability: Number(d.ACTIVE_VIEW_VIEWABILITY ?? 0).toFixed(4),
    cost_per_click: cpcOfficial === "" ? "" : Number(cpcOfficial).toFixed(2),
    // 後方互換 legacy: earnings/clicks。公式 CPC ではない (CPM 等を含むため・§2.1)
    earnings_per_click_legacy: clicks > 0 ? (earnings / clicks).toFixed(2) : "0.00",
    imp_per_pv: pv > 0 ? (imp / pv).toFixed(3) : "0.000",
  };
}

// ── breakdown history (format / placement / bid type × platform・§4.2) ──────

export const ADSENSE_BREAKDOWN_SPECS = Object.freeze([
  { snapshotFile: "formats-platforms.csv", historyFile: "history-formats.csv", keyDim: "AD_FORMAT_CODE" },
  { snapshotFile: "placements-platforms.csv", historyFile: "history-placements.csv", keyDim: "AD_PLACEMENT_CODE" },
  { snapshotFile: "bid-types-platforms.csv", historyFile: "history-bid-types.csv", keyDim: "BID_TYPE_CODE" },
]);

export const ADSENSE_BREAKDOWN_FIELDS = Object.freeze([
  "week",
  "code",
  "platform",
  "earnings",
  "impressions",
  "impressions_rpm",
  "clicks",
  "ctr",
  "viewability",
  "cost_per_click",
  "ad_requests",
  "ad_requests_coverage",
]);

/** breakdown snapshot 行 → history 行。 */
export function adsenseBreakdownRow(week, keyDim, r) {
  const f2 = (v) => (numOrEmpty(v) === "" ? "" : Number(v).toFixed(2));
  const f4 = (v) => (numOrEmpty(v) === "" ? "" : Number(v).toFixed(4));
  return {
    week,
    code: r[keyDim] ?? "unknown",
    platform: r.PLATFORM_TYPE_CODE ?? r.PLATFORM_TYPE_NAME ?? "",
    earnings: Number(r.ESTIMATED_EARNINGS ?? 0).toFixed(2),
    impressions: Number(r.IMPRESSIONS ?? 0),
    impressions_rpm: f2(r.IMPRESSIONS_RPM),
    clicks: Number(r.CLICKS ?? 0),
    ctr: f4(r.IMPRESSIONS_CTR),
    viewability: f4(r.ACTIVE_VIEW_VIEWABILITY),
    cost_per_click: f2(r.COST_PER_CLICK),
    ad_requests: numOrEmpty(r.AD_REQUESTS),
    ad_requests_coverage: f4(r.AD_REQUESTS_COVERAGE),
  };
}
