/**
 * AdSense の収益をページ種別ごとに記録する週次の取得 (2026-11-12 オーナー依頼)。
 *
 * AdSense のページ別レポートはプライバシーの閾値で毎週 0 行なので、AdSense とリンク済みの GA4 から
 * pagePath × 広告の表示・クリック・収益を読み、page-type.mjs でページ種別に分けて
 * data/adsense/snapshots/<week>/page-types.csv に書く。履歴と要約 (history-page-types.csv・LATEST.md) は
 * update-history-csv.mjs (npm run metrics:digest) が作る。形の決まりは lib/adsense-page-types.mjs。
 *
 * Usage:
 *   node .claude/scripts/metrics/fetch-adsense-page-types.mjs [YYYY-Www] [--dry-run]
 *   --dry-run: GA4 を呼ばず、期間と出力先だけを表示する
 *
 * 認証: ../lib/google-client.cjs (GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json)。Property: env GA4_PROPERTY_ID。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PROJECT_ROOT, parseWeekArg, toCsv } from "./lib/auth.mjs";
import { resolvePeriods } from "./lib/periods.mjs";
import {
  GA4_PAGE_TYPE_METRICS,
  PAGE_TYPE_FIELDS,
  PAGE_TYPES_SNAPSHOT_FILE,
  buildPageTypeRows,
} from "./lib/adsense-page-types.mjs";
import { GA4_PROPERTY_ID } from "../lib/site-config.cjs";
import { createGa4DataClient } from "../lib/google-client.cjs";
import { datasetDir } from "../../../config/datasets.mjs";

const PAGE_SIZE = 10000;

/** GA4 の pagePath 行を全件読む (ページ数は週 4,000 前後なので 10,000 件ずつ) */
async function fetchPageRows(analyticsdata, property, periodStart, periodEnd) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: periodStart, endDate: periodEnd }],
        dimensions: [{ name: "pagePath" }],
        metrics: GA4_PAGE_TYPE_METRICS.map((name) => ({ name })),
        limit: PAGE_SIZE,
        offset,
      },
    });
    const batch = res.data.rows ?? [];
    for (const r of batch) {
      const row = { pagePath: r.dimensionValues?.[0]?.value ?? "" };
      GA4_PAGE_TYPE_METRICS.forEach((name, i) => {
        row[name] = r.metricValues?.[i]?.value ?? "0";
      });
      rows.push(row);
    }
    if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  const week = parseWeekArg();
  // AdSense の確定 7 日と同じ窓にする (AdSense の合計と照らせるように)
  const { periodStart, periodEnd } = resolvePeriods({ source: "adsense", week }).finalized7d;
  const outDir = join(PROJECT_ROOT, datasetDir("adsense.snapshots"), week);
  const outPath = join(outDir, PAGE_TYPES_SNAPSHOT_FILE);
  console.log(`[adsense-page-types] ${week}: ${periodStart} ~ ${periodEnd} → ${outPath}`);
  if (process.argv.includes("--dry-run")) return;

  const analyticsdata = createGa4DataClient();
  const property = `properties/${process.env.GA4_PROPERTY_ID || GA4_PROPERTY_ID}`;
  const ga4Rows = await fetchPageRows(analyticsdata, property, periodStart, periodEnd);
  if (ga4Rows.length === 0) {
    // 0 行を「収益 0 円」として書かない (取得の失敗と区別できなくなる)
    throw new Error("GA4 がページの行を 1 件も返さなかった。AdSense と GA4 のリンク・期間・権限を確認する");
  }
  const rows = buildPageTypeRows(ga4Rows);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, toCsv(rows, [...PAGE_TYPE_FIELDS]));
  const total = rows.reduce((s, r) => s + Number(r.revenue_yen), 0);
  console.log(`[adsense-page-types] ${ga4Rows.length} ページ → ページ種別 ${rows.length} 行 (収益の合計 ¥${total.toFixed(0)})`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[adsense-page-types] 失敗: ${error.message || error}`);
    process.exit(1);
  });
}
