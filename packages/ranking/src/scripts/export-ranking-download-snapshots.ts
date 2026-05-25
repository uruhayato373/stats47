#!/usr/bin/env tsx
/**
 * ranking_values の事前生成済みダウンロードファイル (CSV UTF-8 / Shift_JIS / JSON)
 * を R2 に書き出す。Route Handler `/api/ranking/[key]/download` から直接 stream される。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/export-ranking-download-snapshots.ts
 *
 * Options (環境変数):
 *   PARALLELISM=8                 # 並列書き込み数 (default 4)
 *   RANKING_KEY_FILTER=foo-bar    # 特定 ranking_key だけ更新したい場合
 *   DRY_RUN=1                     # R2 に書き込まず件数のみ確認
 */

import { exportRankingDownloadSnapshots } from "../exporters/ranking-download-snapshots";

async function main() {
  const parallelism = process.env.PARALLELISM
    ? Number(process.env.PARALLELISM)
    : undefined;
  const rankingKeyFilter = process.env.RANKING_KEY_FILTER || undefined;
  const dryRun = process.env.DRY_RUN === "1";

  console.log("ranking_download snapshot を R2 に書き出します…");
  const result = await exportRankingDownloadSnapshots({
    parallelism,
    rankingKeyFilter,
    dryRun,
  });
  console.log(
    `✅ ranking_download: metrics=${result.metrics} files=${result.files} mb=${(result.totalSizeBytes / 1024 / 1024).toFixed(2)} duration=${result.durationMs}ms${dryRun ? " (dry-run)" : ""}`,
  );
}

main().catch((err) => {
  console.error("ranking_download export 失敗:", err);
  process.exit(1);
});
