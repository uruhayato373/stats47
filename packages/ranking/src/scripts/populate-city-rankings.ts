#!/usr/bin/env tsx
/**
 * 市区町村ランキングのデータを DB に投入するスクリプト
 *
 * ranking_items (area_type='city') に対して syncRankingExport() を実行し、
 * e-Stat API から市区町村データを取得して ranking_data に upsert する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts --dry-run
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/populate-city-rankings.ts --key total-population
 *
 * Options:
 *   --dry-run     DB に書き込まず、対象一覧を表示する
 *   --key         特定の rankingKey のみ処理する（カンマ区切りで複数指定可）
 *   --delay       API コール間のディレイ (ms, デフォルト: 1200)
 */

import { listRankingItems } from "@stats47/ranking/server";
import { syncRankingExport } from "../services/sync-ranking-export";
import type { RankingItem } from "../types";

const AREA_TYPE = "city";

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const keyIdx = args.indexOf("--key");
  const keyRaw = keyIdx !== -1 ? args[keyIdx + 1]?.trim() : undefined;
  const keys = keyRaw ? keyRaw.split(",").map((k) => k.trim()) : undefined;
  const delayIdx = args.indexOf("--delay");
  const delay = delayIdx !== -1 ? parseInt(args[delayIdx + 1] ?? "1200", 10) : 1200;
  return { dryRun, keys, delay };
}

function classifyItem(item: RankingItem): "estat" | "calculated" {
  if (item.calculation?.isCalculated) return "calculated";
  return "estat";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { dryRun, keys, delay } = parseArgs();

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

  // フィルタ: --key（カンマ区切りで複数指定可）
  if (keys) {
    items = items.filter((item) => keys.includes(item.rankingKey));
    if (items.length === 0) {
      process.stderr.write(`Error: specified keys not found in city ranking items\n`);
      process.exit(1);
    }
  }

  // 投入順序: estat → calculated（依存先が先に処理される）
  items.sort((a, b) => {
    const order = { estat: 0, calculated: 1 };
    return order[classifyItem(a)] - order[classifyItem(b)];
  });

  console.log(`対象: ${items.length} 件 (area_type=${AREA_TYPE})`);
  if (dryRun) {
    for (const item of items) {
      console.log(`  [${classifyItem(item)}] ${item.rankingKey} — ${item.title}`);
    }
    console.log("\n--dry-run: 実際の処理は行いません");
    return;
  }

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

    if (type === "estat" && i < items.length - 1) {
      await sleep(delay);
    }
  }

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
