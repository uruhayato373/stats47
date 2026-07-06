#!/usr/bin/env tsx
/**
 * ranking_items (per-URL) / surveys / categories の master snapshot を R2 に書き出す
 * (完全DBレス: docs/01_技術設計/19)。
 *
 * 通常はバッチ完了時 (/populate-all-rankings, /register-ranking, /sync-articles) に
 * 自動で呼ばれるが、手動で最新化したいときにも単独実行できる。
 *
 * SSOT: git TS (categories/surveys マスタ) + R2 item.json (per-url の正本)。
 * ※ per-url は R2 list (item.json 列挙) が要るため SSD 接続 or S3 認証下で実行。
 *
 * Usage:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/export-master-snapshots.ts
 */

import { exportCategoriesSnapshot } from "@stats47/category/server";

import { exportRankingItemsPerUrl } from "../exporters/ranking-items-per-url-snapshot";
import { exportSurveysSnapshot } from "../exporters/surveys-snapshot";

async function main() {
  console.log("master snapshots を R2 に書き出します…");

  // surveys snapshot (app/survey/all.json) は、items exporter が
  // app/survey/{id}/items.json を生成した survey だけに絞る (関連ランキング 0 件の
  // orphan survey を一覧・サイドバー・generateStaticParams から排除)。そのため
  // items を先に実行し、その surveyIds を surveys snapshot に渡す。categories は独立。
  const [itemsPerUrl, categories] = await Promise.all([
    exportRankingItemsPerUrl(),
    exportCategoriesSnapshot(),
  ]);
  const surveys = await exportSurveysSnapshot(itemsPerUrl.surveyIds, itemsPerUrl.surveyItemCounts);

  console.log(
    `✅ ranking_items_per_url: home=${itemsPerUrl.home.count} / categories=${itemsPerUrl.categories.files} files / items=${itemsPerUrl.items.files} files / surveys=${itemsPerUrl.surveys.files} files / ${itemsPerUrl.totalSizeBytes} bytes / ${itemsPerUrl.durationMs}ms`,
  );
  console.log(
    `✅ surveys: ${surveys.count} 件 (関連ランキングあり / items 生成 ${itemsPerUrl.surveyIds.length} 調査に絞り込み) / ${surveys.sizeBytes} bytes / ${surveys.durationMs}ms`,
  );
  console.log(
    `✅ categories: ${categories.count} 件 / ${categories.sizeBytes} bytes / ${categories.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
