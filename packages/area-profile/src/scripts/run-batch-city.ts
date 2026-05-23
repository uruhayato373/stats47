#!/usr/bin/env tsx
/**
 * 市区町村プロファイル バッチ CLI スクリプト
 *
 * 全 city × metric から「県内ランク 1-5位 = 強み」を抽出し、
 * ローカル D1 の area_profiles テーブル (area_type='city') に保存する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/area-profile/src/scripts/run-batch-city.ts
 *
 * 想定実行時間: ~10-30 秒 (2,701 cities)
 */

import {
  runBatchCityProfile,
  type BatchCallbacks,
} from "../services/run-batch-city-profile";

async function main() {
  const startTime = Date.now();
  let aborted = false;

  const callbacks: BatchCallbacks = {
    onLog({ level, message }) {
      const prefix =
        level === "error" ? "ERROR" : level === "warn" ? "WARN " : "INFO ";
      console.log(`[${prefix}] ${message}`);
    },
    onRunning(total) {
      console.log(`市区町村プロファイル保存開始: ${total} cities`);
    },
    onProgress(completed, skipped, failed) {
      console.log(`progress: completed=${completed} skipped=${skipped} failed=${failed}`);
    },
    onComplete(result) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (result.success) {
        console.log(`\n✅ ${result.message} (${elapsed}s)`);
      } else {
        console.error(`\n❌ ${result.error} (${elapsed}s)`);
        process.exitCode = 1;
      }
    },
    isAborted() {
      return aborted;
    },
    onAbortHandled() {
      aborted = false;
    },
  };

  await runBatchCityProfile(callbacks);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
