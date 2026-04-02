#!/usr/bin/env tsx
/**
 * AI コンテンツ並列生成スクリプト
 *
 * Usage:
 *   NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ai-content/src/scripts/generate-parallel.ts \
 *     [--model claude|gemini] [--concurrency N] [--limit N] [--force]
 *
 * Options:
 *   --model       AI モデル: claude (default) | gemini
 *   --concurrency 並列数 (default: 5)
 *   --limit       処理件数上限 (default: 全件)
 *   --force       既存レコードも再生成
 */

import "dotenv/config";
import { spawn } from "child_process";
import { listRankingItems, listRankingValues } from "@stats47/ranking/server";
import { buildRankingContentPrompt } from "../services/prompts/ranking-content-prompt";
import { upsertRankingAiContent } from "../repositories/upsert-ranking-ai-content";
import { getDrizzle, rankingAiContent } from "@stats47/database/server";
import type { FaqContent } from "../types";

const AREA_TYPE = "prefecture";
const PROMPT_VERSION = "1.0.0";

// ============================================================
// 引数パース
// ============================================================

function parseArgs() {
  const argv = process.argv.slice(2);
  let model = "claude";
  let concurrency = 5;
  let limit = Infinity;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--model" && argv[i + 1]) model = argv[++i];
    else if (argv[i] === "--concurrency" && argv[i + 1]) concurrency = parseInt(argv[++i], 10);
    else if (argv[i] === "--limit" && argv[i + 1]) limit = parseInt(argv[++i], 10);
    else if (argv[i] === "--force") force = true;
  }

  return { model, concurrency, limit, force };
}

// ============================================================
// セマフォ（並列数制御）
// ============================================================

class Semaphore {
  private queue: Array<() => void> = [];

  constructor(private available: number) {}

  acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) next();
    else this.available++;
  }
}

// ============================================================
// AI CLI 呼び出し（stdin にプロンプトを渡す）
// ============================================================

function callAI(model: string, promptContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    let args: string[];

    if (model === "claude") {
      cmd = "claude";
      // Haiku は Sonnet より 5-10x 高速（~10-30s vs ~2-3min per item）
      args = ["-p", "", "--output-format", "text", "--model", "claude-haiku-4-5-20251001"];
    } else {
      cmd = "gemini";
      args = ["-p", "", "-o", "text"];
    }

    // NODE_OPTIONS と CLAUDECODE を子プロセスに引き継がない
    // - NODE_OPTIONS='--conditions react-server': Bun ベースの claude CLI が誤動作する
    // - CLAUDECODE=1: Claude Code セッション内では stdin 経由の長いプロンプトが詰まる
    //   (Claude Code のサンドボックスが ~3KB 以上の stdin をブロックするため)
    //   → このスクリプトは Claude Code の外（ユーザーの端末）で実行することを推奨
    const { NODE_OPTIONS: _n, CLAUDECODE: _c, ...childEnv } = process.env;

    const proc = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: childEnv,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${model} CLI failed (code ${code}): ${stderr.slice(0, 300)}`));
    });

    proc.on("error", (err) => reject(new Error(`spawn error: ${err.message}`)));

    proc.stdin.write(promptContent, "utf-8");
    proc.stdin.end();
  });
}

// ============================================================
// コードフェンス除去
// ============================================================

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  return match ? match[1].trim() : text.trim();
}

// ============================================================
// 1件処理
// ============================================================

async function processOne(
  rankingKey: string,
  rankingName: string,
  unit: string,
  yearCode: string,
  model: string,
  index: number,
  total: number,
  counters: { success: number; fail: number }
): Promise<void> {
  const label = `[${index + 1}/${total}] ${rankingKey}`;

  try {
    // ランキング値を取得
    const valuesResult = await listRankingValues(rankingKey, AREA_TYPE, yearCode);
    if (!valuesResult.success || valuesResult.data.length === 0) {
      process.stdout.write(`[SKIP] ${label}: no ranking values\n`);
      counters.fail++;
      return;
    }

    const sorted = [...valuesResult.data].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    const numericValues = sorted
      .map((v) => v.value)
      .filter((v): v is number => v !== null && v !== undefined);

    const avg =
      numericValues.length > 0
        ? numericValues.reduce((s, v) => s + v, 0) / numericValues.length
        : 0;

    const prompt = buildRankingContentPrompt({
      rankingName,
      unit,
      yearCode,
      top10: sorted.slice(0, 10).map((v) => ({
        rank: v.rank ?? 0,
        areaName: v.areaName,
        value: v.value ?? 0,
      })),
      bottom10: sorted.slice(-10).map((v) => ({
        rank: v.rank ?? 0,
        areaName: v.areaName,
        value: v.value ?? 0,
      })),
      allPrefectures: sorted.map((v) => ({
        rank: v.rank ?? 0,
        areaName: v.areaName,
        value: v.value ?? 0,
      })),
      average: Math.round(avg * 100) / 100,
      min: numericValues.length > 0 ? Math.min(...numericValues) : 0,
      max: numericValues.length > 0 ? Math.max(...numericValues) : 0,
      totalCount: sorted.length,
    });

    // AI 呼び出し
    const raw = await callAI(model, prompt);
    const stripped = stripCodeFence(raw.trim());

    let parsed: { faq?: FaqContent; regionalAnalysis?: string; insights?: string };
    try {
      parsed = JSON.parse(stripped);
    } catch {
      process.stdout.write(`[FAIL] ${label}: JSON parse error\n`);
      counters.fail++;
      return;
    }

    // DB 保存
    await upsertRankingAiContent({
      rankingKey,
      areaType: AREA_TYPE,
      faq: parsed.faq ? JSON.stringify(parsed.faq) : null,
      regionalAnalysis: parsed.regionalAnalysis ?? null,
      insights: parsed.insights ?? null,
      yearCode,
      aiModel: model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      isActive: true,
    });

    process.stdout.write(`[OK] ${label} (${yearCode})\n`);
    counters.success++;
  } catch (err) {
    process.stdout.write(
      `[FAIL] ${label}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}\n`
    );
    counters.fail++;
  }
}

// ============================================================
// メイン
// ============================================================

async function main() {
  const { model, concurrency, limit, force } = parseArgs();

  process.stdout.write(
    `=== AI Content Generator (model: ${model}, concurrency: ${concurrency}) ===\n`
  );

  // ランキング一覧を取得
  const itemsResult = await listRankingItems({ isActive: true, areaType: AREA_TYPE });
  if (!itemsResult.success) {
    process.stderr.write("Error: listRankingItems failed\n");
    process.exit(1);
  }

  const allItems = itemsResult.data.filter((item) => item.latestYear?.yearCode);

  // pending フィルタ
  let pendingItems: Array<{
    rankingKey: string;
    rankingName: string;
    unit: string;
    yearCode: string;
  }>;

  if (force) {
    pendingItems = allItems.map((item) => ({
      rankingKey: item.rankingKey,
      rankingName: item.title ?? item.rankingName,
      unit: item.unit,
      yearCode: item.latestYear!.yearCode.replace(/年度?$/, ""),
    }));
  } else {
    const db = getDrizzle();
    const existingRows = await db
      .select({ rankingKey: rankingAiContent.rankingKey })
      .from(rankingAiContent);
    const existingKeys = new Set(existingRows.map((r) => r.rankingKey));

    pendingItems = allItems
      .filter((item) => !existingKeys.has(item.rankingKey))
      .map((item) => ({
        rankingKey: item.rankingKey,
        rankingName: item.title ?? item.rankingName,
        unit: item.unit,
        yearCode: item.latestYear!.yearCode.replace(/年度?$/, ""),
      }));
  }

  if (limit < Infinity) {
    pendingItems = pendingItems.slice(0, limit);
  }

  const total = pendingItems.length;
  process.stdout.write(`Pending: ${total} items\n\n`);

  if (total === 0) {
    process.stdout.write("All done. No pending items.\n");
    return;
  }

  const counters = { success: 0, fail: 0 };
  const sem = new Semaphore(concurrency);

  const tasks = pendingItems.map((item, index) =>
    sem.acquire().then(() =>
      processOne(
        item.rankingKey,
        item.rankingName,
        item.unit,
        item.yearCode,
        model,
        index,
        total,
        counters
      ).finally(() => {
        sem.release();
        // 50件ごとに進捗表示
        const done = counters.success + counters.fail;
        if (done % 50 === 0 && done > 0) {
          process.stdout.write(
            `--- Progress: ${done}/${total} (success: ${counters.success}, fail: ${counters.fail}) ---\n`
          );
        }
      })
    )
  );

  await Promise.all(tasks);

  process.stdout.write("\n=== Done ===\n");
  process.stdout.write(`Success: ${counters.success}\n`);
  process.stdout.write(`Failed:  ${counters.fail}\n`);
  process.stdout.write(`Total:   ${total}\n`);
}

main().catch((e) => {
  process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
