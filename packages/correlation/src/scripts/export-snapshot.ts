#!/usr/bin/env tsx
/**
 * correlation snapshot を R2 に書き出すだけの軽量 CLI。
 *
 * 通常はバッチ完了時に自動で呼ばれるが、
 * バッチを再実行せずに snapshot だけ最新化したいときに使う。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/correlation/src/scripts/export-snapshot.ts
 */

import { exportCorrelationSnapshot } from "../exporters/correlation-snapshot";
import { exportCorrelationPerKeySnapshots } from "../exporters/per-key-snapshot";

async function main() {
  console.log("correlation snapshot を R2 に書き出します…");

  const [snapshotResult, perKeyResult] = await Promise.all([
    exportCorrelationSnapshot(),
    exportCorrelationPerKeySnapshots(),
  ]);

  console.log(
    `✅ top-pairs / stats 完了 (${snapshotResult.durationMs}ms)`,
  );
  console.log(
    `  ${snapshotResult.topPairs.key} : ${snapshotResult.topPairs.pairCount} pairs / ${snapshotResult.topPairs.sizeBytes} bytes`,
  );
  console.log(
    `  ${snapshotResult.stats.key} : ${snapshotResult.stats.sizeBytes} bytes`,
  );

  console.log(
    `✅ per-ranking-key 完了 (${perKeyResult.durationMs}ms): ${perKeyResult.succeeded} 件成功 / ${perKeyResult.failed} 件失敗 / ${perKeyResult.totalKeys} 件中`,
  );
  console.log(
    `  snapshots/correlation/by-ranking-key/ : 合計 ${perKeyResult.totalBytes} bytes`,
  );

  if (perKeyResult.failed > 0) {
    console.error(
      `⚠️  per-key snapshot の ${perKeyResult.failed} 件で失敗。再実行を推奨`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
