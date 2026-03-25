#!/usr/bin/env tsx
/**
 * 相関分析バッチ CLI スクリプト
 *
 * 全アクティブ ranking_items のペアでピアソン相関係数を計算し、
 * ローカル D1 の correlation_analysis テーブルに upsert する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/correlation/src/scripts/run-batch.ts
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/correlation/src/scripts/run-batch.ts --dry-run
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/correlation/src/scripts/run-batch.ts --limit 1000
 *
 * Options:
 *   --dry-run   DB に書き込まず、ペア数のみ表示する
 *   --limit N   最初の N ペアのみ処理する（テスト用）
 */

import {
  runBatchCorrelation,
  type BatchCorrelationObserver,
} from "../services/run-batch-correlation";

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { dryRun: false, limit: 0 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--limit":
        result.limit = Number(args[++i]) || 0;
        break;
    }
  }
  return result;
}

async function main() {
  const opts = parseArgs();
  const startTime = Date.now();
  let pairTotal = 0;
  let aborted = false;

  const observer: BatchCorrelationObserver = {
    onStart(total) {
      pairTotal = total;
      if (opts.dryRun) {
        console.log(`[DRY-RUN] ペア数: ${total.toLocaleString()}`);
        console.log("実行するには --dry-run を外してください。");
        aborted = true;
        return;
      }
      console.log(`相関分析バッチ開始: ${total.toLocaleString()} ペア`);
      if (opts.limit > 0) {
        console.log(`  --limit ${opts.limit} が指定されています`);
      }
    },
    onProgress(completed, skipped, failed) {
      if (opts.limit > 0 && completed + skipped + failed >= opts.limit) {
        aborted = true;
      }
    },
    onLog(level, message) {
      const prefix =
        level === "error" ? "ERROR" : level === "warn" ? "WARN " : "INFO ";
      console.log(`[${prefix}] ${message}`);
    },
    isAborted() {
      return aborted;
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
  };

  await runBatchCorrelation(observer);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
