#!/usr/bin/env node
/**
 * GA4 から アフィリエイト計測イベント (affiliate_impression / affiliate_click) を取得し、
 * overview（広告/vertical/position）・experiments・pages を独立reportとして集計する。
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
} = require("./lib/affiliate-ga4-reports-core.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
// ★ 2026-07-28 に impression イベントを `ad_impression` → `affiliate_impression` へ改名した。
//   旧名は GA4 の AdSense 連携が自動生成する名前と同じで、取得しても AdSense 分しか返らず
//   CTR の分母にならなかった (直近 7 日 3,346 件が全件 AdSense 由来・残余ゼロ)。
//   改名日より前の窓を指定しても affiliate_impression は 0 件になる (それが正しい挙動)。
const EVENTS = [IMPRESSION_EVENT, CLICK_EVENT];

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
      limit: 10000,
    },
  });
  return data.rows || [];
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: resolveKey(),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const days = Number(process.argv[2] || 28);
  const reports = await fetchAllReports(
    (dimensions) => runReport(analyticsdata, dimensions, days),
    REPORT_SPECS,
  );
  for (const report of Object.values(reports)) {
    for (const failure of report.failures) {
      process.stderr.write(
        `[warn] report=${report.reportName} dims=[${failure.dimensions.join(", ")}] 取得失敗 → 次の tier: ${failure.reason}\n`,
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
    reportQuality: Object.fromEntries(
      Object.entries(reports).map(([name, report]) => [
        name,
        { dimensions: report.dimensions, failures: report.failures },
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

main().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
