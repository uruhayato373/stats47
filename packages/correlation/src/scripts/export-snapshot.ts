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

async function main() {
  console.log("correlation snapshot を R2 に書き出します…");
  const result = await exportCorrelationSnapshot();
  console.log(`✅ 完了 (${result.durationMs}ms)`);
  console.log(
    `  ${result.topPairs.key} : ${result.topPairs.pairCount} pairs / ${result.topPairs.sizeBytes} bytes`,
  );
  console.log(
    `  ${result.stats.key} : ${result.stats.sizeBytes} bytes`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
