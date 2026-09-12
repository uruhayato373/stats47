#!/usr/bin/env node
/**
 * GA4 から アフィリエイト計測イベント (affiliate_impression / affiliate_click) を取得し、
 * overview（広告/vertical/position）・experiments・pages と、任意の placements を独立取得する。
 * 1 reportのrich tier成功が、別reportのcustom dimension欠落を隠さない。
 *
 * /affiliate-improvement の observe モードのデータ源。
 *
 * 前提 (★クラウド実行環境では鍵が無いため未テスト。ローカル / CI で実行):
 *   1. GA4 サービスアカウント鍵 stats47-*.json がリポジトリルートに存在 (gitignored)
 *   2. GA4 管理画面で カスタムディメンション `affiliate_category` / `link_position`
 *      (イベントスコープ) を登録済み。未登録なら eventName 単位の総数のみ取得しフォールバック。
 *
 * 実行: node .claude/scripts/ads/fetch-affiliate-ga4.cjs [days]
 *   days: 集計日数 (デフォルト 28)
 *
 * 出力: 標準出力に Markdown テーブル + .claude/state/ads/ga4-affiliate-<date>.json
 */
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const {
  CLICK_EVENT,
  IMPRESSION_EVENT,
  REPORT_SPECS,
  fetchAllReports,
  pivot,
  shortName,
} = require("./lib/affiliate-ga4-reports-core.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
// ★ 2026-07-28 に impression イベントを `ad_impression` → `affiliate_impression` へ改名した。
//   旧名は GA4 の AdSense 連携が自動生成する名前と同じで、取得しても AdSense 分しか返らず
//   CTR の分母にならなかった (直近 7 日 3,346 件が全件 AdSense 由来・残余ゼロ)。
//   改名日より前の窓を指定しても affiliate_impression は 0 件になる (それが正しい挙動)。
const EVENTS = [IMPRESSION_EVENT, CLICK_EVENT];
const REPORT_PAGE_SIZE = 10000;
// 既存の pages（ページ単位）を変えず、配置・端末・広告の同時内訳を別reportで保持する。
const PLACEMENT_DIMENSIONS = [
  "eventName", "pagePath", "deviceCategory", "customEvent:ad_id", "customEvent:link_position",
];

function resolveKey() {
  for (const name of KEY_CANDIDATES) {
    const p = path.join(PROJECT_ROOT, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `GA4 鍵が見つかりません (${KEY_CANDIDATES.join(" / ")})。ローカル / CI で実行してください。`,
  );
}

async function runReport(analyticsdata, dimensions, days) {
  const rows = [];
  const metadata = [];
  let rowCount = null;
  do {
    const { data } = await analyticsdata.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: EVENTS },
          },
        },
        orderBys: dimensions.map((dimensionName) => ({ dimension: { dimensionName } })),
        limit: REPORT_PAGE_SIZE,
        offset: rows.length,
      },
    });
    if (!Number.isSafeInteger(data.rowCount) || data.rowCount < 0) {
      throw new Error("ga4-row-count-unavailable");
    }
    if (rowCount !== null && rowCount !== data.rowCount) {
      throw new Error("ga4-row-count-changed-during-pagination");
    }
    rowCount = data.rowCount;
    const batch = data.rows ?? [];
    if (!Array.isArray(batch) || (batch.length === 0 && rows.length < rowCount)) {
      throw new Error("ga4-incomplete-report-page");
    }
    rows.push(...batch);
    metadata.push(data.metadata ?? null);
    if (rows.length > rowCount) throw new Error("ga4-row-count-exceeded");
  } while (rows.length < rowCount);
  return { rows, fetchQuality: { rowCount, rowsFetched: rows.length, pagesFetched: metadata.length, metadata } };
}

async function collectReports(analyticsdata, days) {
  const qualityByDimensions = new Map();
  const fetchRows = async (dimensions) => {
    const report = await runReport(analyticsdata, dimensions, days);
    qualityByDimensions.set(dimensions.slice(1).map(shortName).join("|"), report.fetchQuality);
    return report.rows;
  };
  const dimensions = PLACEMENT_DIMENSIONS.slice(1).map(shortName);
  const [required, placements] = await Promise.all([
    fetchAllReports(fetchRows, REPORT_SPECS),
    fetchRows(PLACEMENT_DIMENSIONS).then((rows) => ({
      reportName: "placements", dimensions, rows: pivot(rows, PLACEMENT_DIMENSIONS),
      failures: [], availability: "available",
    })).catch((error) => ({
      reportName: "placements", dimensions, rows: null, availability: "unavailable",
      failures: [{ dimensions, reason: String(error?.message ?? error) }],
    })),
  ]);
  // optional report を取得できなくても従来3reportは保存する。欠損は [] / 0 にしない。
  return Object.fromEntries(Object.entries({ ...required, placements }).map(([name, report]) => [
    name, { ...report, fetchQuality: qualityByDimensions.get(report.dimensions.join("|")) ?? null },
  ]));
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: resolveKey(),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const days = Number(process.argv[2] || 28);
  const reports = await collectReports(analyticsdata, days);
  for (const report of Object.values(reports)) {
    for (const failure of report.failures) {
      process.stderr.write(
        `[warn] report=${report.reportName} dims=[${failure.dimensions.join(", ")}] 取得失敗: ${failure.reason}\n`,
      );
    }
  }

  const valueDimNames = reports.overview.dimensions;
  const hasVerticalDims = valueDimNames.includes("affiliate_vertical");
  const hasCategoryDims =
    hasVerticalDims || valueDimNames.includes("affiliate_category");
  const hasVariantDims = reports.experiments.dimensions.includes("variant_id");

  const pivoted = reports.overview.rows.sort((a, b) => b.impressions - a.impressions);
  const totalImp = pivoted.reduce((s, v) => s + v.impressions, 0);
  const totalClick = pivoted.reduce((s, v) => s + v.clicks, 0);
  const date = new Date().toISOString().slice(0, 10);

  // ── schema v2 (doc 42 §10.1): 認識済み 10 vertical と (unset) の impression 内訳 ──
  // 定数 SSOT は affiliate-operations-core.mjs (ESM)。cjs だが main は async なので dynamic import で読む。
  const { KNOWN_AFFILIATE_VERTICALS, MEASUREMENT_EPOCH, GA4_SNAPSHOT_SCHEMA_VERSION } = await import(
    "./lib/affiliate-operations-core.mjs"
  );
  const knownVerticals = new Set(KNOWN_AFFILIATE_VERTICALS);
  let recognizedVerticalImpressions = 0;
  let unsetVerticalImpressions = 0;
  for (const row of pivoted) {
    const v = row.affiliate_vertical;
    if (knownVerticals.has(v)) recognizedVerticalImpressions += row.impressions;
    else if (v == null || v === "(unset)" || v === "(not set)") unsetVerticalImpressions += row.impressions;
  }

  const snapshot = {
    schemaVersion: GA4_SNAPSHOT_SCHEMA_VERSION,
    measurementEpoch: MEASUREMENT_EPOCH,
    eventNames: { impression: IMPRESSION_EVENT, click: CLICK_EVENT },
    generatedAt: new Date().toISOString(),
    date,
    days,
    dimensions: valueDimNames,
    hasVerticalBreakdown: hasVerticalDims,
    hasCategoryBreakdown: hasCategoryDims,
    hasVariantBreakdown: hasVariantDims,
    hasPlacementBreakdown: reports.placements.availability === "available",
    totals: {
      impressions: totalImp,
      clicks: totalClick,
      ctr: totalImp > 0 ? totalClick / totalImp : null,
    },
    quality: {
      recognizedVerticalImpressions,
      unsetVerticalImpressions,
      unsetVerticalRatio: totalImp > 0 ? unsetVerticalImpressions / totalImp : null,
    },
    overview: reports.overview.rows,
    experiments: reports.experiments.rows,
    pages: reports.pages.rows,
    placements: reports.placements.rows,
    reportQuality: Object.fromEntries(
      Object.entries(reports).map(([name, report]) => [
        name,
        {
          dimensions: report.dimensions, failures: report.failures,
          availability: report.availability ?? "available", fetchQuality: report.fetchQuality,
        },
      ]),
    ),
  };

  const dir = path.join(PROJECT_ROOT, ".claude/state/ads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `ga4-affiliate-${date}.json`),
    JSON.stringify(snapshot, null, 2),
  );

  // Markdown 出力
  const pct = (n) => (n == null ? "—" : (n * 100).toFixed(2) + "%");
  const out = [];
  out.push(`# アフィリエイト GA4 実測 (${date}, 直近 ${snapshot.days} 日)`);
  out.push("");
  if (!hasCategoryDims) {
    out.push(
      "> ⚠ custom dimension `affiliate_vertical` / `affiliate_category` / `link_position` 未登録のため内訳なし (総数のみ)。GA4 管理画面で登録してください (手順: `.claude/rules/affiliate-ads-standards.md` §GA4計測)。",
    );
    out.push("");
  } else if (!hasVerticalDims) {
    out.push(
      "> ⚠ canonical dimension `affiliate_vertical` (10 軸) 未登録。旧 `affiliate_category` で内訳表示中。GA4 管理画面で `affiliate_vertical` を登録すると意図軸で集計できます。",
    );
    out.push("");
  } else if (!hasVariantDims) {
    out.push(
      "> ⚠ A/B variant 用 custom dimension (`experiment_id` / `variant_id` / `creative_size`) 未登録。variant 別 CTR を取るには GA4 管理画面で登録してください。",
    );
    out.push("");
  }
  out.push(
    `総 impression **${totalImp}** / click **${totalClick}** / CTR **${pct(snapshot.totals.ctr)}**`,
  );
  out.push("");

  // 列順 (登録済みの dimension のみ)
  const COL_ORDER = [
    "affiliate_vertical",
    "affiliate_category",
    "link_position",
    "experiment_id",
    "variant_id",
    "creative_size",
  ].filter((c) => valueDimNames.includes(c));

  const headerCols = [...COL_ORDER, "impressions", "clicks", "CTR"];
  const align = COL_ORDER.map(() => "---").concat(["---:", "---:", "---:"]);
  out.push(`| ${headerCols.join(" | ")} |`);
  out.push(`|${align.join("|")}|`);
  for (const v of pivoted) {
    const cells = COL_ORDER.map((c) => v[c] ?? "(all)");
    cells.push(String(v.impressions), String(v.clicks), pct(v.ctr));
    out.push(`| ${cells.join(" | ")} |`);
  }

  // variant 別の experiment サマリ (登録済みのとき)
  if (hasVariantDims) {
    out.push("");
    out.push("## experiment 別 variant CTR (勝敗判定の入力)");
    out.push("");
    out.push(
      "> 判定境界: 各 variant の事前固定sample・期間・freshness・confound guardを通過後、CTRと相対差を人間へ提示します。統計的有意性による自動採用はしません。",
    );
  }

  process.stdout.write(out.join("\n") + "\n");
  process.stderr.write(
    `\n[ga4] snapshot → .claude/state/ads/ga4-affiliate-${date}.json (dims: ${valueDimNames.join(",") || "none"})\n`,
  );
}

module.exports = { PLACEMENT_DIMENSIONS, REPORT_PAGE_SIZE, collectReports, runReport };

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write(`[error] ${e.message}\n`);
    process.exit(1);
  });
}
