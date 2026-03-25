#!/usr/bin/env tsx
/**
 * エリアプロファイル バッチ CLI スクリプト
 *
 * 全アクティブ ranking_items の最新年データから各都道府県の強み・弱みを算出し、
 * ローカル D1 の area_profile_rankings テーブルに保存する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/area-profile/src/scripts/run-batch.ts
 */

import {
  runBatchAreaProfile,
  type BatchCallbacks,
} from "../services/run-batch-area-profile";

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
      console.log(`地域プロファイル保存開始: ${total} 都道府県`);
    },
    onProgress() {
      // 進捗は onLog で十分
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

  await runBatchAreaProfile(callbacks);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
