#!/usr/bin/env tsx
/**
 * 3 層化 schema (indicators / observations) から R2 snapshot を出力する (PR-4)
 *
 * 既存の export-master-snapshots.ts / export-ranking-values-snapshots.ts と
 * byte-for-byte 互換の出力を行う。PR-5 で旧 exporter を本スクリプトに置換する予定。
 *
 * Usage:
 *   # ranking_items snapshot を R2 に書く
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-snapshots-from-3layer.ts items
 *
 *   # ranking_values snapshot を R2 に書く
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-snapshots-from-3layer.ts values [--key=<rankingKey>]
 *
 *   # dry-run (R2 に書かず stdout に件数のみ表示)
 *   npx tsx ... export-snapshots-from-3layer.ts items --dry-run
 */

import { exportRankingItemsFromIndicatorsSnapshot } from "../exporters/ranking-items-from-indicators-snapshot";
import { exportRankingValuesFromObservationsSnapshot } from "../exporters/ranking-values-from-observations-snapshot";

const args = process.argv.slice(2);
const command = args[0];
const dryRun = args.includes("--dry-run");
const keyArg = args.find((a) => a.startsWith("--key="));
const indicatorKeyFilter = keyArg ? keyArg.slice("--key=".length) : undefined;

async function main() {
  if (command === "items") {
    console.log(`ranking_items snapshot (from indicators) を出力… dryRun=${dryRun}`);
    const result = await exportRankingItemsFromIndicatorsSnapshot({ dryRun });
    console.log(
      `${dryRun ? "🧪" : "✅"} ranking_items: ${result.count} 件 / ${result.sizeBytes} bytes / ${result.durationMs}ms (parseFailures=${result.parseFailures})`,
    );
    if (result.parseFailures > 0) process.exitCode = 1;
    return;
  }

  if (command === "values") {
    console.log(
      `ranking_values snapshot (from observations) を出力… dryRun=${dryRun} keyFilter=${indicatorKeyFilter ?? "(all)"}`,
    );
    const result = await exportRankingValuesFromObservationsSnapshot({
      dryRun,
      indicatorKeyFilter,
    });
    console.log(
      `${dryRun ? "🧪" : "✅"} ranking_values: ${result.partitions} partitions / ${result.rows} rows / ${result.totalSizeBytes} bytes / ${result.durationMs}ms`,
    );
    return;
  }

  console.error("Usage: export-snapshots-from-3layer.ts {items|values} [--dry-run] [--key=...]");
  process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
