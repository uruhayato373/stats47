import "dotenv/config";

/**
 * build-input.ts — ランキング 1 件分の AI コンテンツ生成入力を R2 から組み立てる (完全DBレス)。
 *
 * 旧 generate-parallel.ts は D1 (`metrics` / `upsertRankingAiContent`) に依存していたが、
 * 7569bd5c で生成パイプラインごと削除された。本ファイルはその「データ供給」部分を
 * **R2 観測値 + ranking item.json から再構築**したもの。D1 は一切参照しない。
 *
 * 役割:
 *   - readRankingItemFromR2(key)   → rankingName / unit / yearCode (メタ)
 *   - listRankingValues(key, ...)  → 47 県の rank/areaName/value (観測値)
 *   から RankingContentInput を作り、buildRankingContentPrompt でプロンプト文字列を得る。
 *
 * これは「生成の入力を作る純粋な read 処理」であり、生成 (LLM 呼び出し) も保存 (R2 書込) もしない。
 *   - 自動バッチ生成 → generate-parallel.ts が本関数を呼ぶ
 *   - エージェント生成 → ranking-content-author が CLI で {input, prompt} を取得して生成する
 *
 * CLI:
 *   NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *     tsx packages/ai-content/src/scripts/build-input.ts <rankingKey> [--area prefecture] [--prompt-only]
 *
 * 関連: .claude/agents/ranking-content-author.md / .claude/scripts/ai-content/audit-ai-content.mjs
 */

import {
  readRankingItemFromR2,
  listRankingValues,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import {
  buildRankingContentPrompt,
  type RankingContentInput,
  type RankingContentPromptOptions,
} from "../services/prompts/ranking-content-prompt";

export interface BuildInputResult {
  rankingKey: string;
  rankingName: string;
  unit: string;
  yearCode: string;
  totalCount: number;
  input: RankingContentInput;
}

/** "2020年度" / "2020年" / "2020100000" → "2020" に正規化 (4桁年。estat-api.md 規約) */
function normalizeYear(raw: string | null | undefined): string {
  if (!raw) return "";
  const m = String(raw).match(/^(\d{4})/);
  return m ? m[1] : String(raw).replace(/年度?$/, "");
}

/**
 * ランキング 1 件分の生成入力を R2 から組み立てる。
 * 対象が存在しない / 観測値が空 のときは null を返す (呼び元でスキップ)。
 */
export async function buildRankingContentInput(
  rankingKey: string,
  areaType: AreaType = "prefecture",
): Promise<BuildInputResult | null> {
  const itemResult = await readRankingItemFromR2(rankingKey, areaType);
  const item = isOk(itemResult) ? itemResult.data : null;
  if (!item) return null;

  const yearCode = normalizeYear(item.latestYear?.yearCode);
  if (!yearCode) return null;

  const valuesResult = await listRankingValues(rankingKey, areaType, yearCode);
  const values = isOk(valuesResult) ? valuesResult.data : [];
  if (values.length === 0) return null;

  const sorted = [...values].sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
  );
  // RankingValue.value/rank は型上 null 可 (listRankingValues は 0 強制するが型は number|null)。
  const nums = sorted.map((v) => v.value ?? 0);
  const sum = nums.reduce((acc, n) => acc + n, 0);
  const avg = sum / nums.length;

  const toRow = (v: (typeof sorted)[number]) => ({
    rank: v.rank ?? 999,
    areaName: v.areaName,
    value: v.value ?? 0,
  });

  const rankingName = item.title || item.rankingName;
  const unit = item.unit || sorted[0]?.unit || "";

  const input: RankingContentInput = {
    rankingName,
    unit,
    yearCode,
    top10: sorted.slice(0, 10).map(toRow),
    bottom10: sorted.slice(-10).map(toRow),
    allPrefectures: sorted.map(toRow),
    average: Math.round(avg * 100) / 100,
    min: Math.min(...nums),
    max: Math.max(...nums),
    totalCount: sorted.length,
  };

  return {
    rankingKey,
    rankingName,
    unit,
    yearCode,
    totalCount: sorted.length,
    input,
  };
}

/** 入力 + プロンプト文字列をまとめて返す (エージェント / orchestrator 共用) */
export async function buildRankingContentPromptForKey(
  rankingKey: string,
  areaType: AreaType = "prefecture",
  options?: RankingContentPromptOptions,
): Promise<{ meta: BuildInputResult; prompt: string } | null> {
  const meta = await buildRankingContentInput(rankingKey, areaType);
  if (!meta) return null;
  return { meta, prompt: buildRankingContentPrompt(meta.input, options) };
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const argv = process.argv.slice(2);
  const rankingKey = argv.find((a) => !a.startsWith("--"));
  if (!rankingKey) {
    process.stderr.write(
      "usage: tsx build-input.ts <rankingKey> [--area prefecture] [--prompt-only]\n",
    );
    process.exit(2);
  }
  const areaIdx = argv.indexOf("--area");
  const areaType = (areaIdx >= 0 ? argv[areaIdx + 1] : "prefecture") as AreaType;
  const promptOnly = argv.includes("--prompt-only");

  const built = await buildRankingContentPromptForKey(rankingKey, areaType);
  if (!built) {
    process.stderr.write(
      `[build-input] ${rankingKey}: item / 観測値が R2 に無いため入力を作れません\n`,
    );
    process.exit(1);
  }

  if (promptOnly) {
    process.stdout.write(built.prompt);
    return;
  }
  process.stdout.write(
    JSON.stringify(
      { meta: built.meta, prompt: built.prompt },
      null,
      2,
    ) + "\n",
  );
}

// tsx で直接実行されたときのみ main を走らせる (import 時は実行しない)
if (
  process.argv[1] &&
  process.argv[1].endsWith("build-input.ts")
) {
  main().catch((err) => {
    process.stderr.write(
      `[build-input] ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(2);
  });
}
