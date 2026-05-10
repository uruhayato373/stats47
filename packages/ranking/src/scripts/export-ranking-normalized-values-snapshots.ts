#!/usr/bin/env tsx
/**
 * 正規化済み ranking_values snapshot を R2 に書き出す。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-ranking-normalized-values-snapshots.ts
 *
 * Options (環境変数):
 *   PARALLELISM=8                 # 並列書き込み数 (default 8)
 *   RANKING_KEY_FILTER=foo-bar    # 特定 ranking_key だけ更新したい場合
 *   NORM_TYPE_FILTER=per_population  # 特定 normType だけ更新したい場合
 */

import { exportRankingNormalizedValuesSnapshots } from "../exporters/ranking-normalized-values-snapshot";

async function main() {
  const parallelism = process.env.PARALLELISM
    ? Number(process.env.PARALLELISM)
    : undefined;
  const rankingKeyFilter = process.env.RANKING_KEY_FILTER || undefined;
  const normTypeFilter = process.env.NORM_TYPE_FILTER || undefined;

  console.log("ranking_normalized_values snapshot を R2 に書き出します…");
  const result = await exportRankingNormalizedValuesSnapshots({
    parallelism,
    rankingKeyFilter,
    normTypeFilter,
  });
  console.log(
    `✅ ranking_normalized_values: files=${result.files} skipped=${result.skipped} duration=${result.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
