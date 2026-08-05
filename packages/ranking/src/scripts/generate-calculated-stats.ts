#!/usr/bin/env tsx
/**
 * 計算型 metric (`fetcherKey:"calculated"`) の正典 `app/stats/<key>/values.json` を
 * 分子・分母から生成する (完全DBレス)。
 *
 * ## なぜ必要か (2026-08-05 発見)
 *
 * この 3 metric には**計算結果を書く工程がどこにも無かった**。
 * `page-data-batch` は `kind:"external"` を skip し、`generate-ranking-values` は
 * `app/stats` を `app/ranking` へ射影するだけ。`calculateRankingValues` はランタイム用で
 * R2 へ書かない。結果、配信値は単発実行の産物で分子・分母の更新に追従せず、同じ扱いの
 * 3 件が 1 年 / 1 年 / 18 年とバラバラだった。
 *
 * 本 generator は sync-snapshots の task として **ranking-items の後・ranking-values の前**に
 * 走る。app/stats を埋めれば ranking-values が配信 snapshot を自動生成する。
 *
 * ## 規律
 *
 * - 判定・導出は `lib/calculated-stats-core.ts` の純関数。監査 (m) が同じ関数で期待年を出す
 * - **壊れていたら書かない** (0 行・依存欠落・非有限値は throw → exit 1)。空で R2 の既存
 *   データを上書きしない (page-data-batch から続く規律)
 * - `meta.recipe` を必ず焼く。計算の宣言 (periodAlign/scaleFactor/丸め桁) は configHash に
 *   乗るので、宣言を直せば監査 (k) が「再生成が要る」と検出する
 *
 * Usage:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/generate-calculated-stats.ts
 *   ... --dry-run              # 書かずに件数と上位を表示
 *   ... --only <key>[,<key>]   # 一部のみ
 *   ... --json <path>          # dry-run の全行を JSON で書き出す (既存 R2 との突合用)
 */
import { writeFileSync } from "node:fs";

import { buildRecipe, listAllMetrics, type MetricConfig } from "@stats47/data-configs";
import { assertR2WriteAllowed, saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";
import { statsR2Key } from "@stats47/stats-r2";

import {
  buildCalculatedPayload,
  deriveCalculatedRows,
  expectedCalculatedYears,
} from "./lib/calculated-stats-core";

import type { SingleEntityRow } from "@stats47/stats-r2";

const ENTITY_KIND = "prefecture" as const;

/** 計算型 metric の判別。registry の他の calculation 設定 (正規化オプション) と混ざらない */
export function isCalculatedFetcher(config: MetricConfig): boolean {
  return config.source.kind === "external" && config.source.fetcherKey === "calculated";
}

interface Args {
  dryRun: boolean;
  only?: Set<string>;
  json?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: argv.includes("--dry-run") };
  const onlyIdx = argv.indexOf("--only");
  if (onlyIdx !== -1 && argv[onlyIdx + 1]) {
    args.only = new Set(argv[onlyIdx + 1].split(",").map((s) => s.trim()).filter(Boolean));
  }
  const jsonIdx = argv.indexOf("--json");
  if (jsonIdx !== -1 && argv[jsonIdx + 1]) args.json = argv[jsonIdx + 1];
  return args;
}

interface Outcome {
  key: string;
  status: "written" | "failed";
  years?: number;
  rows?: number;
  error?: string;
  payloadRows?: SingleEntityRow[];
}

async function generateOne(config: MetricConfig, dryRun: boolean): Promise<Outcome> {
  const c = config.calculation;
  const numeratorKey = c?.numeratorKey ?? c?.numeratorRankingKey ?? c?.numerator;
  const denominatorKey = c?.denominatorKey ?? c?.denominatorRankingKey ?? c?.denominator;
  if (!numeratorKey || !denominatorKey) {
    return { key: config.key, status: "failed", error: "分子または分母キーが未設定" };
  }

  try {
    const [num, den] = await Promise.all([
      readStatsValues(numeratorKey, ENTITY_KIND),
      readStatsValues(denominatorKey, ENTITY_KIND),
    ]);
    if (!num?.rows?.length) {
      return { key: config.key, status: "failed", error: `分子 ${numeratorKey} の観測値が空` };
    }
    if (!den?.rows?.length) {
      return { key: config.key, status: "failed", error: `分母 ${denominatorKey} の観測値が空` };
    }

    const rows = deriveCalculatedRows({
      config,
      numeratorRows: num.rows,
      denominatorRows: den.rows,
    });

    // 期待年集合と実際が食い違ったら書かない (監査 (m) と同じ関数で判定するので、
    // ここを通れば監査も必ず通る)
    const expected = expectedCalculatedYears(
      config,
      num.rows.map((r) => r.yearCode),
      den.rows.map((r) => r.yearCode),
    );
    const actual = [...new Set(rows.map((r) => r.yearCode))].sort();
    if (expected.join(",") !== actual.join(",")) {
      return {
        key: config.key,
        status: "failed",
        error: `年集合が期待と不一致 expected=${expected.length}件 actual=${actual.length}件`,
      };
    }

    const payload = buildCalculatedPayload(
      config,
      rows,
      buildRecipe(config),
      new Date().toISOString(),
    );

    if (!dryRun) {
      await saveToR2(statsR2Key(config.key, ENTITY_KIND), JSON.stringify(payload), {
        contentType: "application/json",
      });
    }
    return {
      key: config.key,
      status: "written",
      years: actual.length,
      rows: rows.length,
      payloadRows: rows,
    };
  } catch (error) {
    return {
      key: config.key,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun) {
    assertR2WriteAllowed({ op: "generate-calculated-stats (app/stats/<key>/values.json)" });
  }

  let targets = listAllMetrics().filter(isCalculatedFetcher);
  if (args.only) targets = targets.filter((c) => args.only!.has(c.key));

  console.log(
    `[calculated-stats] targets=${targets.length}${args.dryRun ? " (dry-run)" : ""}`,
  );

  // 依存の R2 読み込みが直列でも 3 件なので concurrency は不要 (増えたら mapWithConcurrency へ)
  const outcomes: Outcome[] = [];
  for (const config of targets) {
    outcomes.push(await generateOne(config, args.dryRun));
  }

  for (const o of outcomes) {
    if (o.status === "written") {
      console.log(`  ✓ ${o.key}: ${o.years} 年 / ${o.rows} 行`);
      if (args.dryRun && o.payloadRows && o.payloadRows.length > 0) {
        const latestYear = o.payloadRows[o.payloadRows.length - 1].yearCode;
        const latest = o.payloadRows
          .filter((r) => r.yearCode === latestYear)
          .filter((r) => r.rank != null)
          .sort((a, b) => (a.rank as number) - (b.rank as number))
          .slice(0, 3);
        for (const r of latest) {
          console.log(`      ${r.yearCode} ${r.rank}位 ${r.areaName} ${r.value}${r.unit ?? ""}`);
        }
      }
    } else {
      console.error(`  ✗ ${o.key}: ${o.error}`);
    }
  }

  if (args.json) {
    const dump = Object.fromEntries(
      outcomes.filter((o) => o.payloadRows).map((o) => [o.key, o.payloadRows]),
    );
    writeFileSync(args.json, JSON.stringify(dump, null, 2));
    console.log(`[calculated-stats] JSON: ${args.json}`);
  }

  const failed = outcomes.filter((o) => o.status === "failed");
  if (failed.length > 0) {
    // 沈黙させない。1 件でも落ちたら run.sh が R2 push ごと止める (既存データ温存)
    console.error(`[calculated-stats] ✗ 失敗 ${failed.length} 件`);
    process.exitCode = 1;
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].includes("generate-calculated-stats");

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
