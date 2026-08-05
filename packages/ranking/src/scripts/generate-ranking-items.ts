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
 * - all.json: readActiveRankingKeysFromR2 (generateStaticParams / sitemap) が読む集約
 *
 * 退役 (410) キーの扱いは 2 つで非対称にしてある (理由は main() のコメント):
 * all.json からは除外し、per-key item.json は書き続ける。
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

import {
  buildRankingItemFromMetric,
  type ValuesContext,
} from "../builders/build-ranking-item-from-metric";
import { GONE_RANKING_KEYS } from "../config/gone-ranking-keys";
import { deriveFeaturedTop } from "../exporters/home-featured";
import { RANKING_ITEMS_SNAPSHOT_KEY, rankingItemKeyPath } from "../types/snapshot";
// 順位規則の正典 (値の降順・同値は同順位)。script 間 import だが main() は invokedDirectly で
// ガードされているので副作用は無い。二重実装を避けるためこちらを再利用する。
import { deriveRanks } from "./generate-ranking-values";

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

/**
 * app/stats/<key>/values.json から config.years でフィルタした yearCodes (降順) と、
 * 最新年の「1 位」(latestTop) を 1 回の read で導出する。追加の R2 fetch は無い。
 */
async function loadValuesContext(config: MetricConfig): Promise<ValuesContext | null> {
  // 観測値を持たない種別 (計算・外部) は values 無しで latestYear/latestTop=null にする
  if (config.source.kind === "calculated") return null;
  try {
    const payload = await readStatsValues(config.key, "prefecture");
    if (!payload || payload.rows.length === 0) return null;
    const years = [...new Set(payload.rows.map((r) => r.yearCode))]
      .filter((yc) => yearInSpec(yc, config.years))
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    if (years.length === 0) return null;

    // 最新年の行から「1 位」を導出 (home featured と同一の純関数を再利用)。
    const latestYear = years[0];
    const latestRows = payload.rows
      .filter((r) => r.yearCode === latestYear)
      .map((r) => ({
        areaCode: r.areaCode,
        areaName: r.areaName,
        value: r.value,
        rank: r.rank ?? null,
      }));

    // 手動投入 metric (fetcherKey:"manual") は page-data-batch を通らないため app/stats の行が
    // rank を持たない。deriveFeaturedTop は rank!=null の行しか使わないので、そのままだと
    // 全行が捨てられ latestTop=null になり、一覧カードの「1 位」が空欄になる
    // (2026-08-05 実測: ambulance-hospital-arrival-time / pachinko-shop-density-per-10k)。
    // 配信側 generate-ranking-values は同じ問題を deriveRanks で既に解決しているので、
    // 順位規則を二重実装せずそれを再利用する (条件も buildPartitions と揃える)。
    if (latestRows.every((r) => r.rank == null)) deriveRanks(latestRows);

    const latestTop = deriveFeaturedTop(latestRows);

    return { yearCodes: years, latestTop };
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
    const values = await loadValuesContext(config);
    return buildRankingItemFromMetric(config, {
      values,
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

  // all.json (集約) は --only 指定時も常に全件で書く。ただし退役 (410) キーは載せない。
  //
  // なぜ all.json だけ落として item.json は残すのか (非対称にしている理由):
  //   all.json は generateStaticParams / sitemap / 一覧リーダーの入力なので、410 を返す
  //   キーが載っていると「middleware は 410 / 一覧はリンクを出す」不整合の余地が残る。
  //   リーダー側にも excludeGone があるが、在庫の側からも消して二重にする。
  //   一方 item.json を書くのをやめると、退役の瞬間に isActive:true のまま R2 に取り残され、
  //   item.json を列挙する listRankingItemsWithTagsFromR2 が excludeGone を失った途端に
  //   復活する (stale な true が生き残る)。書き続けて isActive:false を真実に保つ方が安全。
  //
  // 410 判定自体は GONE_RANKING_KEYS (コード) が middleware で行うので、ここから消しても
  // 404 に落ちない。
  const goneInInventory = items.filter((it) => GONE_RANKING_KEYS.has(it.rankingKey));
  const inventory = items.filter((it) => !GONE_RANKING_KEYS.has(it.rankingKey));

  // GONE かつ isActive:true は config の矛盾 (410 を返すのに公開扱い)。除外で見えなくなる
  // 前に必ず出す。config を isActive:false にするか GONE_RANKING_KEYS から外すのが是正。
  const contradictory = goneInInventory.filter((it) => it.isActive);
  if (contradictory.length > 0) {
    console.warn(
      `⚠️  GONE なのに isActive:true が ${contradictory.length} 件: ${contradictory
        .map((it) => it.rankingKey)
        .join(", ")}`,
    );
  }

  const allBody = JSON.stringify({
    generatedAt: now,
    count: inventory.length,
    items: inventory,
  });
  if (!args.dryRun) {
    await saveToR2(RANKING_ITEMS_SNAPSHOT_KEY, allBody, {
      contentType: "application/json; charset=utf-8",
    });
  }
  const active = inventory.filter((it) => it.isActive).length;
  console.log(
    `✅ all.json: items=${inventory.length} active=${active} gone除外=${goneInInventory.length} bytes=${allBody.length} ${args.dryRun ? "(dry-run)" : "push"}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
