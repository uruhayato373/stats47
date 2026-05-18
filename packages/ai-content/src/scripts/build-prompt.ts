#!/usr/bin/env tsx
/**
 * 指定ランキングキーの AI コンテンツ生成プロンプトを構築して出力する。
 *
 * Usage:
 *   npx tsx packages/ai-content/src/scripts/build-prompt.ts --key <rankingKey>
 *     [--extra-context-file <path>]
 *
 * Options:
 *   --key                  対象 ranking_key (必須)
 *   --extra-context-file   /enhance-ranking-ai-content スキルで構築した extraContext
 *                          (NotebookLM 出典) を読み込み prompt に prepend する
 *
 * Output (JSON to stdout):
 *   {
 *     "rankingKey": "A1101",
 *     "rankingName": "人口総数",
 *     "yearCode": "2023",
 *     "prompt": "あなたは日本の統計データを分析する専門家です。..."
 *   }
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { listRankingItems, listRankingValues } from "@stats47/ranking/server";
import { buildRankingContentPrompt } from "../services/prompts/ranking-content-prompt";
import type { RankingContentInput } from "../services/prompts/ranking-content-prompt";

const AREA_TYPE = "prefecture";

function parseArgs(): { key: string; extraContextFile: string | null } {
  const argv = process.argv.slice(2);
  let key = "";
  let extraContextFile: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--key" && argv[i + 1]) key = argv[++i];
    else if (argv[i] === "--extra-context-file" && argv[i + 1])
      extraContextFile = argv[++i];
  }
  if (!key) {
    process.stderr.write("Error: --key <rankingKey> is required\n");
    process.exit(1);
  }
  return { key, extraContextFile };
}

async function main() {
  const { key, extraContextFile } = parseArgs();

  // ランキングメタ情報を取得
  const itemsResult = await listRankingItems({ isActive: true, areaType: AREA_TYPE });
  if (!itemsResult.success) {
    process.stderr.write(`Error: listRankingItems failed\n`);
    process.exit(1);
  }

  const item = itemsResult.data.find((i) => i.rankingKey === key);
  if (!item) {
    process.stderr.write(`Error: ranking key "${key}" not found\n`);
    process.exit(1);
  }
  if (!item.latestYear?.yearCode) {
    process.stderr.write(`Error: no yearCode for "${key}"\n`);
    process.exit(1);
  }

  const yearCode = item.latestYear.yearCode.replace(/年度?$/, "");

  // ランキング値を取得
  const valuesResult = await listRankingValues(key, AREA_TYPE, yearCode);
  if (!valuesResult.success || valuesResult.data.length === 0) {
    process.stderr.write(`Error: no ranking values for "${key}" (${yearCode})\n`);
    process.exit(1);
  }

  const values = valuesResult.data;

  // 統計量を計算
  const sorted = [...values].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  const numericValues = sorted
    .map((v) => v.value)
    .filter((v): v is number => v !== null && v !== undefined);

  const avg =
    numericValues.length > 0
      ? numericValues.reduce((s, v) => s + v, 0) / numericValues.length
      : 0;
  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;

  const allPrefectures = sorted.map((v) => ({
    rank: v.rank ?? 0,
    areaName: v.areaName,
    value: v.value ?? 0,
  }));

  const input: RankingContentInput = {
    rankingName: item.title ?? item.rankingName,
    unit: item.unit,
    yearCode,
    top10: allPrefectures.slice(0, 10),
    bottom10: allPrefectures.slice(-10),
    allPrefectures,
    average: Math.round(avg * 100) / 100,
    min,
    max,
    totalCount: sorted.length,
  };

  const extraContext = extraContextFile
    ? readFileSync(extraContextFile, "utf8")
    : undefined;
  const prompt = buildRankingContentPrompt(input, { extraContext });

  const output = {
    rankingKey: key,
    rankingName: input.rankingName,
    yearCode,
    extraContextChars: extraContext?.length ?? 0,
    prompt,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
