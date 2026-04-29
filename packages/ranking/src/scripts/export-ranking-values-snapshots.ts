#!/usr/bin/env tsx
/**
 * ranking_values の partition snapshot を R2 に書き出す。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-ranking-values-snapshots.ts
 *
 * Options (環境変数):
 *   PARALLELISM=24                # 並列書き込み数 (default 24)
 *   RANKING_KEY_FILTER=foo-bar    # 特定 ranking_key だけ更新したい場合
 */

import { exportRankingValuesSnapshots } from "../exporters/ranking-values-snapshot";

async function main() {
  const parallelism = process.env.PARALLELISM
    ? Number(process.env.PARALLELISM)
    : undefined;
  const rankingKeyFilter = process.env.RANKING_KEY_FILTER || undefined;

  console.log("ranking_values snapshot を R2 に書き出します…");
  const result = await exportRankingValuesSnapshots({
    parallelism,
    rankingKeyFilter,
  });
  console.log(
    `✅ ranking_values: partitions=${result.partitions} rows=${result.rows} bytes=${result.totalSizeBytes} duration=${result.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
