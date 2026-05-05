#!/usr/bin/env tsx
/**
 * AI コンテンツ生成が必要なランキング一覧を出力する。
 *
 * metrics.year_code が NULL のものを列挙する。
 *
 * Usage:
 *   npx tsx packages/ai-content/src/scripts/list-pending.ts
 *   npx tsx packages/ai-content/src/scripts/list-pending.ts --force
 *
 * Options:
 *   --force  全件を対象に含める（既存レコードがあっても対象にする）
 *
 * Output (JSON to stdout):
 *   { "total": 42, "pending": 5, "items": [...] }
 */

import "dotenv/config";
import { listRankingItems } from "@stats47/ranking/server";
import { metrics, getDrizzle } from "@stats47/database/server";
import { isNotNull } from "drizzle-orm";

const AREA_TYPE = "prefecture";

const force = process.argv.includes("--force");

async function main() {
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

  const items = itemsResult.data.filter((item) => item.latestYear?.yearCode);
  const total = items.length;

  // AI テキスト生成済みの key 一覧 (year_code IS NOT NULL)
  const db = getDrizzle();
  const existingRows = await db
    .select({ key: metrics.key })
    .from(metrics)
    .where(isNotNull(metrics.yearCode));
  const existingKeys = new Set(existingRows.map((r) => r.key));

  const pending: Array<{
    rankingKey: string;
    rankingName: string;
    unit: string;
    yearCode: string;
  }> = [];

  for (const item of items) {
    const yearCode = item.latestYear!.yearCode.replace(/年度?$/, "");

    if (!force && existingKeys.has(item.rankingKey)) continue;

    pending.push({
      rankingKey: item.rankingKey,
      rankingName: item.title ?? item.rankingName,
      unit: item.unit,
      yearCode,
    });
  }

  const output = { total, pending: pending.length, items: pending };
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
