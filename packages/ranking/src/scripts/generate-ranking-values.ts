#!/usr/bin/env tsx
/**
 * 観測値の正典 R2 `app/stats/<key>/values.json` → 配信用 R2 `app/ranking/<key>/values.json`
 * を決定的に再生成する generator (完全DBレス)。
 *
 * ## なぜ必要か (2026-07-27 障害の恒久対策)
 *
 * Phase 6 (2026-05-27) で D1 の stats_* を DROP した際、`ranking-values` の export task が
 * 廃止されたまま**代替の writer が作られなかった**。結果:
 *
 * - ranking 詳細 / category / survey / theme / チャート / OGP 生成 / blog スクリプトは
 *   すべて `readRankingValuesFromR2` 経由で `app/ranking/<key>/values.json` を読み続けていたが、
 *   その中身は 2026-05-27 で**凍結された stale データ**だった
 * - Phase 6 以降に isActive 化した metric は values.json を**一度も持たず**、ページは
 *   HTTP 200 だがチャートが「データがありません」の空ページとして公開されていた (実測 67 件)
 * - item.json は fresh 生成されるため item.latestYear と values の年がズレうる
 *
 * 本 generator が app/stats を入力に values.json を再生成することで、readers 側を一切変えずに
 * 上記すべてが解消する。正典は常に app/stats (page-data-batch が更新)。
 *
 * ## 設計
 *
 * - 入力は config (対象キーの決定) + R2 `app/stats/<key>/values.json` のみ。item.json は読まない
 * - rank / yearName / unit は app/stats の行が既に持つのでそのまま引き継ぐ (再導出しない =
 *   正典と配信で順位がズレない)
 * - 年は config.years でフィルタ (generate-ranking-items と同一規則)。partition は新しい年が先
 * - 出力は `RankingValuesKeySnapshotSchema` (zod) を満たす形。reader 側の parse で弾かれない
 * - 正規化版 (values-per-population / -per-area) は対象外。runtime に computeNormalization の
 *   fallback があるため v1 では作らない
 *
 * R2 書き込みは assertR2WriteAllowed で保護 (ローカルは --dry-run 推奨)。
 *
 * Usage (CI / sync-snapshots):
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/generate-ranking-values.ts
 *   ... --dry-run            # R2 に書かず件数のみ
 *   ... --only <key>[,<key>] # 一部 metric のみ
 */
import {
  listAllMetrics,
  type MetricConfig,
  type YearSpec,
} from "@stats47/data-configs";
import { assertR2WriteAllowed, saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";

import { rankingValuesKeyPath } from "../types/snapshot";

import type { RankingValue } from "../types";
import type { RankingValuesKeySnapshot } from "../types/snapshot";

const CONCURRENCY = 20;
const AREA_TYPE = "prefecture" as const;

interface Args {
  dryRun: boolean;
  only: Set<string> | null;
}

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const onlyIdx = argv.indexOf("--only");
  const only =
    onlyIdx >= 0 && argv[onlyIdx + 1]
      ? new Set(argv[onlyIdx + 1].split(",").map((s) => s.trim()).filter(Boolean))
      : null;
  return { dryRun, only };
}

/** yearCode (4桁) が config.years 範囲内か (generate-ranking-items と同一規則) */
function yearInSpec(yearCode: string, spec: YearSpec): boolean {
  if (spec === "all") return true;
  const y = parseInt(yearCode, 10);
  if (!Number.isFinite(y)) return false;
  if ("from" in spec) return y >= spec.from && y <= spec.to;
  if ("years" in spec) return spec.years.includes(y);
  return false;
}

/**
 * 正典 (page-data-batch) と同一規則で rank を導出する。
 *
 * 規則: 値の降順・同値は同順位 (競技順位)。方向による分岐は無い
 * (`packages/data-configs/scripts/page-data-batch.ts` の rank 計算と一致させること。
 *  `isReversed` はカラースケール用の設定で順位方向ではない)。
 *
 * 手動投入 metric (fetcherKey:"manual") は page-data-batch を通らないため app/stats の行が
 * rank を持たない。2026-07-27 に ambulance-hospital-arrival-time /
 * pachinko-shop-density-per-10k がこれに該当し、rank 欠落行を捨てる実装だったため
 * values.json が生成されず OGP パイプラインを止めていた。
 */
export function deriveRanks<T extends { value: number | null; rank: number | null }>(
  entries: T[],
): void {
  const ranked = entries
    .filter((e) => e.value != null)
    .sort((a, b) => (b.value as number) - (a.value as number));
  let prevValue: number | null = null;
  let prevRank = 0;
  ranked.forEach((e, i) => {
    if (prevValue !== null && e.value === prevValue) {
      e.rank = prevRank;
    } else {
      e.rank = i + 1;
      prevRank = i + 1;
      prevValue = e.value;
    }
  });
}

/**
 * app/stats の行を配信用 partition 群に変換する。
 *
 * rank は app/stats が持つ値を優先して引き継ぐ (正典と配信で順位が食い違わないため)。
 * 正典が rank を持たない場合 (手動投入 metric) のみ、正典と同一規則で導出する。
 */
export function buildPartitions(
  metricKey: string,
  rows: readonly {
    areaCode: string;
    areaName: string;
    yearCode: string;
    yearName?: string | null;
    value: number | null;
    unit?: string | null;
    rank?: number | null;
  }[],
  years: YearSpec,
): RankingValuesKeySnapshot["partitions"] {
  // 年 partition に振り分け。rank は正典の値をそのまま持ち込む (無ければ null)
  interface Entry {
    row: (typeof rows)[number];
    value: number | null;
    rank: number | null;
  }
  const rawByYear = new Map<string, Entry[]>();
  for (const row of rows) {
    if (!yearInSpec(row.yearCode, years)) continue;
    const entry: Entry = {
      row,
      value: row.value,
      rank: row.rank != null && Number.isFinite(row.rank) ? row.rank : null,
    };
    const arr = rawByYear.get(row.yearCode);
    if (arr) arr.push(entry);
    else rawByYear.set(row.yearCode, [entry]);
  }

  const byYear = new Map<string, RankingValue[]>();
  for (const [yearCode, entries] of rawByYear) {
    // 正典が rank を持たない年だけ導出する (持っている年は 1 行も書き換えない)
    if (entries.every((e) => e.rank == null)) deriveRanks(entries);

    const values: RankingValue[] = [];
    for (const { row, rank } of entries) {
      if (rank == null) continue; // 値が null の行は順位を持てない
      values.push({
        metricKey,
        areaType: AREA_TYPE,
        areaCode: row.areaCode,
        areaName: row.areaName,
        yearCode: row.yearCode,
        yearName: row.yearName ?? row.yearCode,
        value: row.value,
        unit: row.unit ?? "",
        rank,
      } as RankingValue);
    }
    if (values.length > 0) byYear.set(yearCode, values);
  }

  // 年は新しい順 / partition 内は順位昇順 (旧 snapshot と同じ並び)
  return [...byYear.entries()]
    .sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10))
    .map(([yearCode, values]) => {
      const sorted = [...values].sort((a, b) => a.rank - b.rank);
      return { yearCode, count: sorted.length, values: sorted };
    });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface Outcome {
  key: string;
  status: "written" | "skipped-no-values" | "failed";
  partitions?: number;
  rows?: number;
  error?: string;
}

/**
 * 一時的なネットワークエラー (undici の "terminated" 等) を再試行する。
 *
 * 2,255 キーを一括処理するため、1 件の瞬断でバッチ全体が落ちるのは割に合わない
 * (2026-07-27 初回実行で written=2244 / failed=1 "terminated" が実発生し、
 *  run.sh が push 前に exit したため 2,244 件の生成が無駄になった)。
 * 読み取りは冪等なので安全に再試行できる。
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** i));
      }
    }
  }
  throw lastError;
}

async function generateOne(config: MetricConfig, dryRun: boolean): Promise<Outcome> {
  try {
    const payload = await withRetry(() => readStatsValues(config.key, AREA_TYPE));
    if (!payload || payload.rows.length === 0) {
      return { key: config.key, status: "skipped-no-values" };
    }

    const partitions = buildPartitions(config.key, payload.rows, config.years);
    if (partitions.length === 0) {
      return { key: config.key, status: "skipped-no-values" };
    }

    const snapshot: RankingValuesKeySnapshot = {
      generatedAt: new Date().toISOString(),
      rankingKey: config.key,
      areaType: AREA_TYPE,
      partitions,
    };

    if (!dryRun) {
      await saveToR2(rankingValuesKeyPath(config.key, AREA_TYPE), JSON.stringify(snapshot), {
        contentType: "application/json; charset=utf-8",
      });
    }

    return {
      key: config.key,
      status: "written",
      partitions: partitions.length,
      rows: partitions.reduce((sum, p) => sum + p.count, 0),
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
    assertR2WriteAllowed({ op: "generate-ranking-values (app/ranking/<key>/values.json)" });
  }

  const all = listAllMetrics();
  // 観測値を持たない calculated は対象外 (app/stats に rows が無い)
  let targets = all.filter(
    (c) => c.entities?.includes(AREA_TYPE) && c.source.kind !== "calculated",
  );
  if (args.only) targets = targets.filter((c) => args.only!.has(c.key));

  console.log(`[values] registry=${all.length} targets=${targets.length}${args.dryRun ? " (dry-run)" : ""}`);

  const outcomes = await mapWithConcurrency(targets, CONCURRENCY, (c) => generateOne(c, args.dryRun));

  const written = outcomes.filter((o) => o.status === "written");
  const skipped = outcomes.filter((o) => o.status === "skipped-no-values");
  const failed = outcomes.filter((o) => o.status === "failed");

  console.log(
    `[values] written=${written.length} skipped(no values)=${skipped.length} failed=${failed.length}`,
  );

  if (skipped.length > 0) {
    // 観測値が無いキーは「公開されているが空ページ」になる。監査で追えるよう一覧を出す
    console.log(`[values] no observations: ${skipped.map((o) => o.key).join(", ")}`);
  }
  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.error(`  ✗ ${f.key}: ${f.error}`);
    if (failed.length > 20) console.error(`  ... 他 ${failed.length - 20} 件`);
    // 失敗を黙って success にしない (2026-07-27 の silent partial failure の教訓)
    process.exitCode = 1;
  }
}

// 直接実行時のみ main を走らせる (buildPartitions を import してテストできるようにするため)
const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].includes("generate-ranking-values");

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
