#!/usr/bin/env tsx
/**
 * 全ランキングの全年度データを DB に一括投入するスクリプト
 *
 * syncRankingExport() を全アクティブ ranking_items に対して実行し、
 * e-Stat API から取得した全年度データを ranking_data テーブルに upsert する。
 *
 * Usage:
 *   npx tsx packages/ranking/src/scripts/populate-all-rankings.ts
 *   npx tsx packages/ranking/src/scripts/populate-all-rankings.ts --dry-run
 *   npx tsx packages/ranking/src/scripts/populate-all-rankings.ts --source estat
 *   npx tsx packages/ranking/src/scripts/populate-all-rankings.ts --key total-population
 *
 * Options:
 *   --dry-run     DB に書き込まず、対象一覧を表示する
 *   --source      データソースでフィルタ (estat | calculated)
 *   --key         特定の rankingKey のみ処理する
 *   --delay       API コール間のディレイ (ms, デフォルト: 1200)
 */

// 前提: npx tsx -r ./packages/ranking/src/scripts/setup-cli.js で実行すること
// （setup-cli.js が .env.local ロード、NODE_ENV 設定、server-only 無効化を行う）
import { listRankingItems } from "@stats47/ranking/server";
import { syncRankingExport } from "../services/sync-ranking-export";
import type { RankingItem } from "../types";

const AREA_TYPE = "prefecture";

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourceIdx = args.indexOf("--source");
  const source = sourceIdx !== -1 ? args[sourceIdx + 1]?.trim() : undefined;
  const keyIdx = args.indexOf("--key");
  const key = keyIdx !== -1 ? args[keyIdx + 1]?.trim() : undefined;
  const delayIdx = args.indexOf("--delay");
  const delay = delayIdx !== -1 ? parseInt(args[delayIdx + 1] ?? "1200", 10) : 1200;
  return { dryRun, source, key, delay };
}

function classifyItem(item: RankingItem): "estat" | "calculated" {
  if (item.calculation?.isCalculated) return "calculated";
  return "estat";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { dryRun, source, key, delay } = parseArgs();

  // 1. 全アクティブ ranking_items を取得
  const itemsResult = await listRankingItems({
    isActive: true,
    areaType: AREA_TYPE,
  });

  if (!itemsResult.success) {
    process.stderr.write(
      `Error: listRankingItems failed: ${itemsResult.error?.message ?? "unknown"}\n`
    );
    process.exit(1);
  }

  let items = itemsResult.data;

  // フィルタ: --key
  if (key) {
    items = items.filter((item) => item.rankingKey === key);
    if (items.length === 0) {
      process.stderr.write(`Error: rankingKey "${key}" not found\n`);
      process.exit(1);
    }
  }

  // フィルタ: --source
  if (source) {
    items = items.filter((item) => classifyItem(item) === source);
  }

  // 投入順序: estat → calculated（依存先が先に処理される）
  items.sort((a, b) => {
    const order = { estat: 0, calculated: 1 };
    return order[classifyItem(a)] - order[classifyItem(b)];
  });

  console.log(`対象: ${items.length} 件`);
  if (dryRun) {
    for (const item of items) {
      console.log(`  [${classifyItem(item)}] ${item.rankingKey} — ${item.title}`);
    }
    console.log("\n--dry-run: 実際の処理は行いません");
    return;
  }

  // 2. 各アイテムで syncRankingExport を実行
  let success = 0;
  let failed = 0;
  const errors: Array<{ key: string; error: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;
    const type = classifyItem(item);

    process.stdout.write(`${progress} ${item.rankingKey} (${type})...`);

    try {
      const result = await syncRankingExport(item);

      if (result.success) {
        const yearCount = result.years?.length ?? 0;
        console.log(` OK (${yearCount} years)`);
        success++;
      } else {
        console.log(` FAILED: ${result.error}`);
        failed++;
        errors.push({ key: item.rankingKey, error: result.error ?? "unknown" });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(` ERROR: ${msg}`);
      failed++;
      errors.push({ key: item.rankingKey, error: msg });
    }

    // e-Stat API レートリミット対策（estat タイプのみ待機）
    if (type === "estat" && i < items.length - 1) {
      await sleep(delay);
    }
  }

  // 3. サマリー出力
  console.log("\n--- Summary ---");
  console.log(`Total: ${items.length}, Success: ${success}, Failed: ${failed}`);

  if (errors.length > 0) {
    console.log("\nFailed items:");
    for (const { key, error } of errors) {
      console.log(`  ${key}: ${error}`);
    }
  }
}

main().catch((e) => {
  process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
