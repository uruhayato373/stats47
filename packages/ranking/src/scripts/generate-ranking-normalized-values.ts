#!/usr/bin/env tsx
/**
 * 観測値の正典 R2 `app/stats/<key>/values.json` → 配信用の
 *   - `app/ranking/<key>/values-per-population.json`
 *   - `app/ranking/<key>/values-per-area.json`
 *   - `app/ranking/<key>/national-trend.json` (全国時系列・基準別)
 * を決定的に再生成する generator (完全DBレス)。
 *
 * ## なぜ必要か (2026-07-29 障害の恒久対策)
 *
 * 正規化スナップショットには **2 つの欠陥が同時に存在**していた:
 *
 * 1. **値が 100 倍過大** — 分母の総面積は unit「１００Ｋm2」= 100km² 単位で格納されているのに、
 *    km² とみなして `分子 / 分母 × scaleFactor(100)` を計算していた。実測で東京 2015 が
 *    61,433,050 人/100km² (正しくは 614,330)。全県・全年で一律 100.00 倍。
 * 2. **writer が存在しなかった** — Phase 6 (2026-05-27, `ba298ec5a`) で D1 依存の exporter が
 *    削除されたまま代替が作られず、R2 には 2026-05-21 生成の orphan が 2 ヶ月残り続けた。
 *    reader は snapshot を runtime 計算より優先するため、誤値が配信され続けていた。
 *
 * 本 generator は (1) 計算を runtime と同じ `services/normalize-core.ts` に委譲することで
 * 実装ドリフトを構造的に排除し、(2) sync-snapshots の定常タスクとして stale を防ぐ。
 * さらに push 前に fixture 値域ゲート (`lib/normalized-fixtures.ts`) を通し、
 * 100 倍級のズレが再発したら R2 に出る前に落とす。
 *
 * ## 設計
 *
 * - 入力は config (対象キーの決定) + R2 `app/stats/<key>/values.json` のみ
 * - 分母 (total-population / 総面積) は各 1 回だけ読んでキャッシュし全キーで使い回す
 * - 年マッチングは runtime と同一 (同年 → 無ければ分母の最新年へフォールバック)
 * - 出力の正規化 snapshot は `RankingValuesKeySnapshotSchema` 準拠 (reader 無変更で読める)
 * - 失敗は silent にしない (想定外の空は failed 扱いで exitCode=1)
 *
 * R2 書き込みは assertR2WriteAllowed で保護 (ローカルは --dry-run 推奨)。
 *
 * Usage (CI / sync-snapshots):
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/generate-ranking-normalized-values.ts
 *   ... --dry-run            # R2 に書かず件数のみ
 *   ... --only <key>[,<key>] # 一部 metric のみ
 */
import {
  listAllMetrics,
  type MetricConfig,
  type NormalizationOption,
  findExpectedEmpty,
} from "@stats47/data-configs";
import { assertR2WriteAllowed, saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";

import { resolveDenominator } from "../services/normalize-core";
import { rankingNationalTrendPath, rankingNormalizedValuesKeyPath } from "../types/snapshot";
import { invalidNormTypeForKey } from "../utils/drop-invalid-norm-options-core";

import { buildPartitions } from "./generate-ranking-values";
import {
  BASIS_LABELS,
  buildDenominatorTable,
  buildNationalTrendSeries,
  buildNormalizedPartitions,
  type DenominatorTable,
} from "./lib/normalized-values-core";
import { checkFixtureGates, fixtureGateRankingKeys } from "./lib/normalized-fixtures";

import type {
  NationalTrendBasis,
  NationalTrendSeries,
  RankingNationalTrendSnapshot,
  RankingValuesKeySnapshot,
} from "../types/snapshot";

const CONCURRENCY = 20;
const AREA_TYPE = "prefecture" as const;
const NORM_TYPES = ["per_population", "per_area"] as const;

type NormType = (typeof NORM_TYPES)[number];

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

/** 一時的なネットワークエラーを再試行する (読み取りは冪等) */
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

/** config から有効な正規化 option を取り出す (自己正規化は除外) */
export function activeNormalizationOptions(config: MetricConfig): NormalizationOption[] {
  const options =
    config.calculation?.normalizationOptions ?? config.display?.normalizationOptions ?? [];
  const invalidType = invalidNormTypeForKey(config.key);
  return options.filter(
    (o): o is NormalizationOption =>
      (NORM_TYPES as readonly string[]).includes(o.type) && o.type !== invalidType,
  );
}

/**
 * config 側の NormalizationOption 型には denominatorKey が無い (registry 実績 0 件) が、
 * ranking-item 側の型は持つ。将来 config に足された場合も runtime と同じ扱いになるよう
 * 実行時に読む (存在すれば単位換算せず係数 1 = normalize-core の規約)。
 */
function denominatorKeyOf(option: NormalizationOption): string | undefined {
  const v = (option as { denominatorKey?: unknown }).denominatorKey;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

interface Outcome {
  key: string;
  status: "written" | "skipped-no-values" | "skipped-no-options" | "failed";
  normTypes?: string[];
  trendSeries?: number;
  error?: string;
}

interface GenerateResult {
  outcome: Outcome;
  /** fixture ゲート検査のために保持する (対象 key のみ) */
  fixtureSamples?: {
    normType: NormType;
    yearCode: string;
    valuesByAreaCode: Map<string, number | null>;
  }[];
}

async function generateOne(
  config: MetricConfig,
  denominators: Map<string, DenominatorTable>,
  dryRun: boolean,
  collectFixtures: boolean,
): Promise<GenerateResult> {
  try {
    const options = activeNormalizationOptions(config);
    if (options.length === 0) {
      return { outcome: { key: config.key, status: "skipped-no-options" } };
    }

    const payload = await withRetry(() => readStatsValues(config.key, AREA_TYPE));
    if (!payload || payload.rows.length === 0) {
      return { outcome: { key: config.key, status: "skipped-no-values" } };
    }

    const basePartitions = buildPartitions(config.key, payload.rows, config.years);
    if (basePartitions.length === 0) {
      return { outcome: { key: config.key, status: "skipped-no-values" } };
    }

    const generatedAt = new Date().toISOString();
    const writtenTypes: string[] = [];
    const fixtureSamples: GenerateResult["fixtureSamples"] = [];

    // 全国時系列: まず素の値の series
    const series: NationalTrendSeries[] = [
      buildNationalTrendSeries(
        basePartitions,
        "original",
        BASIS_LABELS.original,
        config.unit ?? "",
      ),
    ];

    for (const option of options) {
      const normType = option.type as NormType;
      const denominatorSpec = resolveDenominator(normType, AREA_TYPE, denominatorKeyOf(option));
      if (!denominatorSpec) continue;

      const table = denominators.get(denominatorSpec.key);
      if (!table || table.byYear.size === 0) continue;

      const partitions = buildNormalizedPartitions(basePartitions, table, {
        metricKey: config.key,
        unit: option.unit,
        scaleFactor: option.scaleFactor,
        valueScaleToBaseUnit: denominatorSpec.valueScaleToBaseUnit,
      });
      if (partitions.length === 0) continue;

      const snapshot: RankingValuesKeySnapshot = {
        generatedAt,
        rankingKey: config.key,
        areaType: AREA_TYPE,
        partitions,
      };

      if (collectFixtures) {
        // 最新年 (partitions[0]) を fixture 検査対象にする
        const latest = partitions[0];
        fixtureSamples.push({
          normType,
          yearCode: latest.yearCode,
          valuesByAreaCode: new Map(latest.values.map((v) => [v.areaCode, v.value])),
        });
      }

      if (!dryRun) {
        await saveToR2(
          rankingNormalizedValuesKeyPath(config.key, normType),
          JSON.stringify(snapshot),
          { contentType: "application/json; charset=utf-8" },
        );
      }
      writtenTypes.push(normType);

      series.push(
        buildNationalTrendSeries(
          partitions,
          normType as NationalTrendBasis,
          option.label || BASIS_LABELS[normType as NationalTrendBasis],
          option.unit,
        ),
      );
    }

    if (writtenTypes.length === 0) {
      // 正規化 option はあるのに 1 つも作れなかった = 分母マッチ不能 (想定外)
      return {
        outcome: {
          key: config.key,
          status: "failed",
          error: `正規化 option ${options.map((o) => o.type).join("/")} があるが分母を解決できず 0 件`,
        },
      };
    }

    const trend: RankingNationalTrendSnapshot = {
      generatedAt,
      rankingKey: config.key,
      areaType: AREA_TYPE,
      series: series.filter((s) => s.points.length > 0),
    };
    if (!dryRun) {
      await saveToR2(rankingNationalTrendPath(config.key), JSON.stringify(trend), {
        contentType: "application/json; charset=utf-8",
      });
    }

    return {
      outcome: {
        key: config.key,
        status: "written",
        normTypes: writtenTypes,
        trendSeries: trend.series.length,
      },
      fixtureSamples: collectFixtures ? fixtureSamples : undefined,
    };
  } catch (error) {
    return {
      outcome: {
        key: config.key,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/** 分母 metric を読んで DenominatorTable にする */
async function loadDenominators(keys: string[]): Promise<Map<string, DenominatorTable>> {
  const map = new Map<string, DenominatorTable>();
  for (const key of keys) {
    try {
      const payload = await withRetry(() => readStatsValues(key, AREA_TYPE));
      if (!payload || payload.rows.length === 0) {
        console.warn(`[normalized] 分母 ${key} の観測値が空`);
        continue;
      }
      map.set(key, buildDenominatorTable(payload.rows));
      console.log(`[normalized] 分母 ${key}: ${payload.rows.length} rows`);
    } catch (error) {
      console.error(
        `[normalized] 分母 ${key} の読み込み失敗: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return map;
}

/** 正規化に必要な分母 key を全部集める */
function requiredDenominatorKeys(configs: MetricConfig[]): string[] {
  const keys = new Set<string>();
  for (const config of configs) {
    for (const option of activeNormalizationOptions(config)) {
      const spec = resolveDenominator(option.type, AREA_TYPE, denominatorKeyOf(option));
      if (spec) keys.add(spec.key);
    }
  }
  return [...keys];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun) {
    assertR2WriteAllowed({
      op: "generate-ranking-normalized-values (app/ranking/<key>/values-per-*.json, national-trend.json)",
    });
  }

  const all = listAllMetrics();
  let targets = all.filter(
    (c) =>
      c.entities?.includes(AREA_TYPE) &&
      c.source.kind !== "calculated" &&
      activeNormalizationOptions(c).length > 0,
  );
  if (args.only) targets = targets.filter((c) => args.only!.has(c.key));

  console.log(
    `[normalized] registry=${all.length} targets=${targets.length}${args.dryRun ? " (dry-run)" : ""}`,
  );
  if (targets.length === 0) {
    console.log("[normalized] 対象キーなし");
    return;
  }

  const denominators = await loadDenominators(requiredDenominatorKeys(targets));
  if (denominators.size === 0) {
    console.error("[normalized] 分母を 1 つも読めなかったため中止");
    process.exitCode = 1;
    return;
  }

  // --- fixture ゲート (先行実行・push 前に落とす) ---
  const fixtureKeys = fixtureGateRankingKeys().filter((k) => targets.some((t) => t.key === k));
  if (fixtureKeys.length > 0) {
    const violations: string[] = [];
    for (const key of fixtureKeys) {
      const config = targets.find((t) => t.key === key)!;
      const result = await generateOne(config, denominators, true, true);
      if (result.outcome.status === "failed") {
        violations.push(`${key}: 生成失敗 (${result.outcome.error})`);
        continue;
      }
      for (const sample of result.fixtureSamples ?? []) {
        const found = checkFixtureGates({
          rankingKey: key,
          normType: sample.normType,
          valuesByAreaCode: sample.valuesByAreaCode,
          yearCode: sample.yearCode,
        });
        violations.push(...found.map((v) => v.message));
      }
    }
    if (violations.length > 0) {
      console.error("[normalized] ✗ fixture 値域ゲート違反 — R2 に書かず中止:");
      for (const v of violations) console.error(`    ${v}`);
      process.exitCode = 1;
      return;
    }
    console.log(`[normalized] ✓ fixture 値域ゲート通過 (${fixtureKeys.length} keys)`);
  } else {
    console.warn("[normalized] fixture ゲート対象キーが targets に無い (--only 実行時は想定内)");
  }

  const results = await mapWithConcurrency(targets, CONCURRENCY, (c) =>
    generateOne(c, denominators, args.dryRun, false),
  );
  const outcomes = results.map((r) => r.outcome);

  const written = outcomes.filter((o) => o.status === "written");
  const skippedNoValues = outcomes.filter((o) => o.status === "skipped-no-values");
  const failed = outcomes.filter((o) => o.status === "failed");
  const perType = new Map<string, number>();
  for (const o of written) {
    for (const t of o.normTypes ?? []) perType.set(t, (perType.get(t) ?? 0) + 1);
  }

  console.log(
    `[normalized] written=${written.length} skipped(no values)=${skippedNoValues.length} failed=${failed.length}`,
  );
  console.log(
    `[normalized] per type: ${[...perType.entries()].map(([t, n]) => `${t}=${n}`).join(" ")} / national-trend=${written.length}`,
  );

  if (skippedNoValues.length > 0) {
    console.log(`[normalized] no observations: ${skippedNoValues.map((o) => o.key).join(", ")}`);
  }
  // 沈黙させない (2026-07-29 障害): 一覧を出すだけでは CI が緑のまま通ってしまう。
  // EXPECTED_EMPTY に登録済みのキーだけを許容する。
  const unexpectedSkips = skippedNoValues.filter(
    (o) => !findExpectedEmpty(o.key, AREA_TYPE, new Date()),
  );
  if (unexpectedSkips.length > 0) {
    console.error(
      `[normalized] ✗ 観測値が無い未登録キー ${unexpectedSkips.length} 件: ${unexpectedSkips.map((o) => o.key).join(", ")}\n` +
        `        意図した 0 件なら packages/data-configs/src/expected-empty.ts に登録します`,
    );
    process.exitCode = 1;
  }
  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.error(`  ✗ ${f.key}: ${f.error}`);
    if (failed.length > 20) console.error(`  ... 他 ${failed.length - 20} 件`);
    // 失敗を黙って success にしない
    process.exitCode = 1;
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].includes("generate-ranking-normalized-values");

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
