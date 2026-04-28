#!/usr/bin/env tsx
/**
 * ranking_items / surveys / categories の master snapshot を R2 に書き出す。
 *
 * 通常はバッチ完了時 (/populate-all-rankings, /register-ranking, /sync-articles) に
 * 自動で呼ばれるが、手動で最新化したいときにも単独実行できる。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-master-snapshots.ts
 */

import { exportCategoriesSnapshot } from "@stats47/category/server";

import { exportRankingItemsSnapshot } from "../exporters/ranking-items-snapshot";
import { exportSurveysSnapshot } from "../exporters/surveys-snapshot";

async function main() {
  console.log("master snapshots を R2 に書き出します…");

  const [items, surveys, categories] = await Promise.all([
    exportRankingItemsSnapshot(),
    exportSurveysSnapshot(),
    exportCategoriesSnapshot(),
  ]);

  console.log(
    `✅ ranking_items: ${items.count} 件 / ${items.sizeBytes} bytes / ${items.durationMs}ms (parseFailures=${items.parseFailures})`,
  );
  console.log(
    `✅ surveys: ${surveys.count} 件 / ${surveys.sizeBytes} bytes / ${surveys.durationMs}ms`,
  );
  console.log(
    `✅ categories: ${categories.count} 件 / ${categories.sizeBytes} bytes / ${categories.durationMs}ms`,
  );

  if (items.parseFailures > 0) {
    console.error(
      `⚠️  ${items.parseFailures} 件の ranking_item で parseRankingItemDB が失敗。schema を確認`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
