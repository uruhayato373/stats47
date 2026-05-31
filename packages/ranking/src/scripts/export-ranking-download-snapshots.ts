#!/usr/bin/env tsx
/**
 * ランキングのダウンロード用 CSV/JSON を事前生成して R2 (.local/r2) に書き出す。
 * R2 反映は diff-push-r2 (CI/クラウド専用)。route `/api/ranking/[key]/download` が stream する。
 *
 * Usage:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/export-ranking-download-snapshots.ts
 *   # 単一 metric のみ:
 *     npx tsx packages/ranking/src/scripts/export-ranking-download-snapshots.ts --ranking-key <key>
 */

import { exportRankingDownloadSnapshots } from "../exporters/ranking-download-snapshots";

async function main() {
  const idx = process.argv.indexOf("--ranking-key");
  const rankingKeyFilter = idx !== -1 ? process.argv[idx + 1] : undefined;

  const res = await exportRankingDownloadSnapshots({ rankingKeyFilter });
  console.log(
    `✅ ranking-download: metrics=${res.metrics} files=${res.files} ` +
      `(${(res.totalSizeBytes / 1024 / 1024).toFixed(1)}MB) ${res.durationMs}ms`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
