#!/usr/bin/env tsx
/**
 * config (git TS, SSOT) → R2 `app/ranking/<key>/item.json` + `app/ranking-items/all.json`
 * を決定的に再生成する generator (完全DBレス: docs/01_技術設計/19)。
 *
 * 設計の核心: item.json を入力にしない。入力は config + R2 `app/stats/<key>/values.json`
 * (public read) のみ。これで「config を変えれば item.json が決まる」不変条件を保証し、
 * DBレス移行 (67168f54) が残した config→item.json 写像の follow-up を完成させる。
 *
 * - per-key item.json: cachedFindRankingItem / readRankingItemFromR2 が読む正本
 * - all.json: readActiveRankingKeysFromR2 (generateStaticParams / sitemap / 410判定) が読む集約
 *
 * R2 書き込みは assertR2WriteAllowed で CI / クラウド専用 (ローカルは --dry-run / ガード停止)。
 *
 * Usage (CI / sync-snapshots):
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx packages/ranking/src/scripts/generate-ranking-items.ts
 *   ... --dry-run            # R2 に書かず件数のみ
 *   ... --only <key>[,<key>] # 一部 metric のみ (item.json のみ更新、all.json は全件)
 */
import {
  listAllMetrics,
  type MetricConfig,
  type MetricRegistry,
  type YearSpec,
} from "@stats47/data-configs";
import { assertR2WriteAllowed, saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";

import { buildRankingItemFromMetric } from "../builders/build-ranking-item-from-metric";
import { RANKING_ITEMS_SNAPSHOT_KEY, rankingItemKeyPath } from "../types/snapshot";

import type { RankingItem } from "../types/ranking-item";

const CONCURRENCY = 20;

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

/** yearCode (4桁) が config.years 範囲内か */
function yearInSpec(yearCode: string, spec: YearSpec): boolean {
  if (spec === "all") return true;
  const y = parseInt(yearCode, 10);
  if (!Number.isFinite(y)) return false;
  if ("from" in spec) return y >= spec.from && y <= spec.to;
  if ("years" in spec) return spec.years.includes(y);
  return false;
}

/** app/stats/<key>/values.json から config.years でフィルタした yearCodes (降順) を得る */
async function loadYearCodes(config: MetricConfig): Promise<string[] | null> {
  // 観測値を持たない種別 (計算・外部) は values 無しで latestYear=null にする
  if (config.source.kind === "calculated") return null;
  try {
    const payload = await readStatsValues(config.key, "prefecture");
    if (!payload || payload.rows.length === 0) return null;
    const years = [...new Set(payload.rows.map((r) => r.yearCode))]
      .filter((yc) => yearInSpec(yc, config.years))
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return years.length > 0 ? years : null;
  } catch {
    return null;
  }
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date().toISOString();

  // 都道府県を持つ全 metric (active/inactive 問わず item.json を生成。
  // isActive の絞り込みは all.json reader / known-keys 側で行う)
  const allMetrics = listAllMetrics();
  const metrics = allMetrics.filter((c) => c.entities?.includes("prefecture"));
  // calculated metric の分子/分母から survey を辿るための registry (survey 紐付け導出用)
  const registry: MetricRegistry = Object.fromEntries(allMetrics.map((m) => [m.key, m]));
  console.log(`prefecture metrics: ${metrics.length} (only=${args.only ? [...args.only].join(",") : "all"}, dryRun=${args.dryRun})`);

  if (!args.dryRun) {
    assertR2WriteAllowed({ op: "generate ranking item.json" });
  }

  // 全件 build (all.json 用に全 RankingItem が要る)
  const items: RankingItem[] = await mapWithConcurrency(metrics, CONCURRENCY, async (config) => {
    const yearCodes = await loadYearCodes(config);
    return buildRankingItemFromMetric(config, {
      values: yearCodes ? { yearCodes } : null,
      now,
      registry,
    });
  });

  // per-key item.json を書く (--only 指定時はその key のみ)
  const targets = args.only
    ? items.filter((it) => args.only!.has(it.rankingKey))
    : items;
  let written = 0;
  await mapWithConcurrency(targets, CONCURRENCY, async (item) => {
    const body = JSON.stringify({ generatedAt: now, item });
    if (!args.dryRun) {
      await saveToR2(rankingItemKeyPath(item.rankingKey), body, {
        contentType: "application/json; charset=utf-8",
      });
    }
    written++;
  });
  console.log(`✅ item.json: ${written} 件 ${args.dryRun ? "(dry-run)" : "push"}`);

  // all.json (集約) は常に全件で書く
  const allBody = JSON.stringify({ generatedAt: now, count: items.length, items });
  if (!args.dryRun) {
    await saveToR2(RANKING_ITEMS_SNAPSHOT_KEY, allBody, {
      contentType: "application/json; charset=utf-8",
    });
  }
  const active = items.filter((it) => it.isActive).length;
  console.log(
    `✅ all.json: items=${items.length} active=${active} bytes=${allBody.length} ${args.dryRun ? "(dry-run)" : "push"}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
