/**
 * adsense-report-contract — AdSense Management API v2 の job 別 dimension/metric 互換契約 (pure)。
 *
 * 本ファイルが AdSense job / metric / manifest / history schema のコード SSOT。
 *
 * - job ごとに要求してよい dimensions / metrics を固定する (全 metric を全 dimension に投げない)。
 *   unit/format/placement 系では PAGE_VIEWS / PAGE_VIEWS_RPM が 0 になり比較指標にできないため
 *   要求しない。主指標は IMPRESSIONS_RPM。
 * - 公式 COST_PER_CLICK / IMPRESSIONS_RPM / AD_REQUESTS / AD_REQUESTS_COVERAGE を取得する。
 * - 各 job の結果は manifest (schemaVersion 2・期間 metadata・status・limitations) で保存する。
 *   PAGE_URL の 0 行は privacy-threshold であり、error や 0 PV と混同しない。
 * - currency / timeZone は API response から取れた場合だけ確定値にする。取れなければ
 *   "unknown" + limitation。
 *
 * pure module (I/O なし)。テスト: __tests__/adsense-contract.test.mjs
 */

export const ADSENSE_MANIFEST_SCHEMA_VERSION = 2;
export const ADSENSE_SOURCE = "adsense-management-api-v2";
export const MANIFEST_FILE = "manifest.json";

/** account KPI / device で使う全 metric。 */
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

/** unit/format/placement/bid-type 等 PAGE_VIEWS が意味を持たない job 用。 */
export const METRICS_IMPRESSION_BASED = Object.freeze(
  METRICS_FULL.filter((m) => m !== "PAGE_VIEWS" && m !== "PAGE_VIEWS_RPM"),
);

/**
 * job 契約。file 名は既存 snapshot 形式を維持しつつ新 job を追加する。
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
 * job の実行結果を status に分類する。
 * - error があれば "error"
 * - PAGE_URL 0 行は "privacy-threshold" (エラーや 0 PV と扱わない)
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
 * manifest entry を組み立てる。
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

// ── history schema v2 (公式 CPC と後方互換 legacy 収益/click の分離) ─────────────

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
    // 後方互換 legacy: earnings/clicks。公式 CPC ではない (CPM 等を含むため)
    earnings_per_click_legacy: clicks > 0 ? (earnings / clicks).toFixed(2) : "0.00",
    imp_per_pv: pv > 0 ? (imp / pv).toFixed(3) : "0.000",
  };
}

// ── breakdown history (format / placement / bid type × platform) ───────────

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

// ── ad unit inventory (API read-only。レポートではないので別契約) ──────────────
//
// レポート job は「期間 × dimension × metric」だが inventory は「今存在する広告ユニットの一覧」で
// 期間概念を持たない。そのため REPORT_JOBS / buildJobManifest / classifyJobStatus を流用せず
// 専用の契約を持つ (期間や metric を持たない manifest に "ESTIMATED_EARNINGS は推定値" のような
// レポート固有 limitation を付けないため)。
//
// unit_id は adunits.list の reportingDimensionId で、レポートの AD_UNIT_ID と同値。
// これがコード側 slot と AdSense 側 unit を結ぶ突き合わせキーになる (displayName は
// 人が管理画面で変えられるため名前だけの突合は壊れる)。

/** inventory の出力ファイル名。 */
export const AD_UNITS_FILE = "ad-units.csv";

/** inventory manifest の job 名 (manifest.jobs のキー)。 */
export const AD_UNITS_JOB_NAME = "ad-units";

/** ad unit inventory CSV の列。 */
export const AD_UNIT_INVENTORY_FIELDS = Object.freeze([
  "unit_id",
  "display_name",
  "state",
  "type",
  "size",
  "slot_id",
]);

/**
 * AdSense の adCode スニペットから data-ad-slot を抽出する (pure)。
 * 属性の引用符は "..." / '...' の両方を許す。取れなければ null を返し、推測で埋めない。
 */
export function extractSlotIdFromAdCode(adCode) {
  if (typeof adCode !== "string" || adCode.length === 0) return null;
  const m = adCode.match(/data-ad-slot\s*=\s*["'](\d+)["']/);
  return m ? m[1] : null;
}

/**
 * adunits.list の 1 件 (+ adCode) から inventory 行を作る (pure)。
 * 欠損は "" にする (0 や推測値で埋めない)。
 */
export function adUnitInventoryRow(unit, adCode = null) {
  const settings = unit?.contentAdsSettings ?? {};
  return {
    unit_id: unit?.reportingDimensionId ?? "",
    display_name: unit?.displayName ?? "",
    state: unit?.state ?? "",
    type: settings.type ?? "",
    size: settings.size ?? "",
    slot_id: extractSlotIdFromAdCode(adCode) ?? "",
  };
}

/**
 * inventory の status を分類する。
 * レポートの classifyJobStatus とは別軸 (privacy-threshold / partial の概念が無い)。
 */
export function classifyInventoryStatus(rowCount, { error = null } = {}) {
  if (error) return "error";
  return rowCount === 0 ? "missing" : "complete";
}

/**
 * inventory の manifest entry を組み立てる (pure)。
 * 期間・metric・通貨を持たないので buildJobManifest とは別実装にする。
 */
export function buildInventoryManifest({
  rowCount,
  status,
  generatedAt,
  slotIdMissingCount = 0,
  limitations = [],
  error = null,
}) {
  const lim = [...limitations];
  if (slotIdMissingCount > 0) {
    lim.push(
      `slot_id を adCode から抽出できなかったユニット: ${slotIdMissingCount} 件 (推測で埋めていない)`,
    );
  }
  if (error) lim.push(`API error: ${String(error).slice(0, 200)}`);
  return {
    schemaVersion: ADSENSE_MANIFEST_SCHEMA_VERSION,
    source: ADSENSE_SOURCE,
    kind: "inventory",
    generatedAt,
    fields: [...AD_UNIT_INVENTORY_FIELDS],
    rowCount,
    status,
    limitations: lim,
  };
}

// ── unit 単位 history (ユニットごとの最適化を効果測定可能にする) ────────────────
//
// 既存の history-devices.csv / history-<breakdown>.csv は platform 列を持つが units.csv は
// platform 次元を持たないため、ADSENSE_BREAKDOWN_SPECS に entry を足す形では列が合わない。
// そのため専用の列集合と行ビルダーを持つ。
//
// match_status で「コード側 slot と突き合わせられたか」を必ず記録する。突き合わせ不能を
// 空欄で沈黙させると、ユニット最適化の効果測定が黙って壊れるため。

/** unit history CSV の列。 */
export const ADSENSE_UNIT_FIELDS = Object.freeze([
  "week",
  "unit_id",
  "unit_name",
  "slot_id",
  "code_slot",
  "match_status",
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

/** unit history のファイル名。 */
export const ADSENSE_UNIT_HISTORY_FILE = "history-units.csv";

/**
 * match_status の値。
 * - matched            … unit_id (または adUnitName) がコード側 slot 定数に解決できた
 * - legacy-name-matched… AD_UNIT_ID 列が無い過去週で、旧名 map 経由で解決できた
 * - unmanaged          … AdSense 側に存在するがコードが参照しない (Auto ads・アンカー枠等)
 * - orphan             … レポートに出るが現在の inventory に無い (削除済みユニットの過去データ)
 */
export const ADSENSE_UNIT_MATCH_STATUSES = Object.freeze([
  "matched",
  "legacy-name-matched",
  "unmanaged",
  "orphan",
]);

/**
 * AD_UNIT_ID 列が入る前の週にだけ適用する旧 unit 名 → canonical unit 名の対応 (append-only)。
 *
 * **推測で埋めない。** ad-units.csv (inventory) の実 displayName と突き合わせて確定した対応だけを
 * 追記する。空のままでも unit history は動き、未解決行は match_status=unmanaged として残る。
 */
export const ADSENSE_LEGACY_UNIT_NAME_MAP = Object.freeze({});

/**
 * レポート行 1 件のコード側 slot 対応を解決する (pure)。
 *
 * @param {object} args
 * @param {string|null} args.unitId    レポートの AD_UNIT_ID (列が無い週は null)
 * @param {string} args.unitName       レポートの AD_UNIT_NAME
 * @param {Map<string,{slot_id?:string}>} args.inventoryByUnitId ad-units.csv の索引
 * @param {{bySlotId:Map<string,object[]>, byAdUnitName:Map<string,object[]>}} args.codeIndex
 * @param {Record<string,string>} [args.legacyNameMap]
 * @returns {{slotId:string, codeSlot:string, matchStatus:string}}
 */
export function resolveUnitMatch({
  unitId,
  unitName,
  inventoryByUnitId,
  codeIndex,
  legacyNameMap = ADSENSE_LEGACY_UNIT_NAME_MAP,
}) {
  const names = (list) => (list || []).map((s) => s.exportName).join("|");

  if (unitId) {
    const inv = inventoryByUnitId?.get(unitId);
    if (!inv) {
      // レポートにはあるが現在の inventory に無い = 削除済みユニットの過去データ
      return { slotId: "", codeSlot: "", matchStatus: "orphan" };
    }
    const slotId = inv.slot_id || "";
    const hit = slotId ? codeIndex?.bySlotId?.get(slotId) : null;
    if (hit && hit.length > 0) {
      return { slotId, codeSlot: names(hit), matchStatus: "matched" };
    }
    return { slotId, codeSlot: "", matchStatus: "unmanaged" };
  }

  // AD_UNIT_ID 列が無い週: 名前で解決する
  const canonical = legacyNameMap?.[unitName] ?? null;
  if (canonical) {
    const hit = codeIndex?.byAdUnitName?.get(canonical);
    if (hit && hit.length > 0) {
      return { slotId: hit[0].slotId ?? "", codeSlot: names(hit), matchStatus: "legacy-name-matched" };
    }
  }
  const direct = codeIndex?.byAdUnitName?.get(unitName);
  if (direct && direct.length > 0) {
    return { slotId: direct[0].slotId ?? "", codeSlot: names(direct), matchStatus: "matched" };
  }
  return { slotId: "", codeSlot: "", matchStatus: "unmanaged" };
}

/**
 * units.csv の 1 行 → unit history 行 (pure)。
 * match は resolveUnitMatch が決めた結果を受け取る (この関数は数値整形だけを担う)。
 */
export function adsenseUnitRow(week, r, match) {
  const f2 = (v) => (numOrEmpty(v) === "" ? "" : Number(v).toFixed(2));
  const f4 = (v) => (numOrEmpty(v) === "" ? "" : Number(v).toFixed(4));
  return {
    week,
    unit_id: r.AD_UNIT_ID ?? "",
    unit_name: r.AD_UNIT_NAME ?? "",
    slot_id: match?.slotId ?? "",
    code_slot: match?.codeSlot ?? "",
    match_status: match?.matchStatus ?? "unmanaged",
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
