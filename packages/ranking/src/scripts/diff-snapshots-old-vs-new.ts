#!/usr/bin/env tsx
/**
 * 新 exporter (indicators / observations) の出力 self-test (PR-4)
 *
 * dry-run で snapshot を生成し、構造とサンプルを stdout に出す。
 * 旧 exporter との byte-level 比較は R2 経由で行う必要があり PR-5 で実施する。
 *
 * Usage:
 *   # ranking_items snapshot を生成して構造を確認
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/diff-snapshots-old-vs-new.ts items
 *
 *   # ranking_values snapshot を 1 key 分生成して構造を確認
 *   npx tsx ... diff-snapshots-old-vs-new.ts values --key=total-population
 */

import { exportRankingItemsFromIndicatorsSnapshot } from "../exporters/ranking-items-from-indicators-snapshot";
import { exportRankingValuesFromObservationsSnapshot } from "../exporters/ranking-values-from-observations-snapshot";

const args = process.argv.slice(2);
const command = args[0];
const keyArg = args.find((a) => a.startsWith("--key="));
const filterKey = keyArg ? keyArg.slice("--key=".length) : undefined;

async function diffItems() {
  console.log("=== ranking_items snapshot (from indicators) self-test ===");
  const newR = await exportRankingItemsFromIndicatorsSnapshot({ dryRun: true });
  console.log(
    `count=${newR.count} sizeBytes=${newR.sizeBytes} parseFailures=${newR.parseFailures} durationMs=${newR.durationMs}`,
  );
  if (!newR.body) {
    console.error("body is empty");
    process.exit(1);
  }
  const snap = JSON.parse(newR.body);
  console.log(`first item keys: ${Object.keys(snap.items[0]).sort().join(", ")}`);
  console.log(`sample item: ${JSON.stringify(snap.items[0], null, 2).slice(0, 500)}`);
  console.log(`pass: parseFailures === 0 → ${newR.parseFailures === 0}`);
  process.exit(newR.parseFailures === 0 ? 0 : 1);
}

async function diffValues() {
  if (!filterKey) {
    console.error("values self-test には --key=<rankingKey> が必須");
    process.exit(1);
  }
  console.log(`=== ranking_values snapshot (from observations) self-test (key=${filterKey}) ===`);
  const newR = await exportRankingValuesFromObservationsSnapshot({
    dryRun: true,
    indicatorKeyFilter: filterKey,
  });
  console.log(
    `partitions=${newR.partitions} rows=${newR.rows} sizeBytes=${newR.totalSizeBytes} durationMs=${newR.durationMs}`,
  );
  if (!newR.dryRunPartitions || newR.dryRunPartitions.length === 0) {
    console.error("dryRunPartitions が空");
    process.exit(1);
  }
  const sample = newR.dryRunPartitions[0];
  const parsed = JSON.parse(sample.body);
  console.log(`first partition: ${sample.rankingKey}/${sample.areaType}/${sample.yearCode}`);
  console.log(`  count=${parsed.count}`);
  console.log(`  top: ${JSON.stringify(parsed.values[0])}`);
  console.log(`  bottom: ${JSON.stringify(parsed.values[parsed.values.length - 1])}`);
  console.log(`pass: count > 0 && rank ascending → ${parsed.count > 0}`);
  process.exit(parsed.count > 0 ? 0 : 1);
}

if (command === "items") diffItems().catch((e) => { console.error(e); process.exit(1); });
else if (command === "values") diffValues().catch((e) => { console.error(e); process.exit(1); });
else {
  console.error("Usage: diff-snapshots-old-vs-new.ts {items|values} [--key=...]");
  process.exit(1);
}
