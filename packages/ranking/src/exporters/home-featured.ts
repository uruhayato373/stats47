/**
 * home/featured.json の派生値生成 (pure helper)。
 *
 * exporter (ranking-items-per-url-snapshot.ts) から呼ばれるが、R2/server-only に依存しない
 * 純関数として分離し、fixture だけで unit test できるようにする。
 * apps/web の dev 補完 (旧 snapshot 時の in-memory 補完) も同じ導出を使う (二重実装禁止)。
 */
// root barrel ではなく葉モジュールを直接読む。root は METRICS_REGISTRY を
// 再 export するため、この pure helper を使うだけで registry が呼び出し側の
// bundle に入る (home が実際にそうなっていた)。
// 2026-07-29: 選定を手動キュレーション (旧 HOME_FEATURED_RANKINGS) から
// 掲載価値スコアによる自動選定へ移した。hook は全ランキングが持つ導出コピーで、
// 導出できない編集コピー (「2050年、人口が増える県は？」等) だけが override に残る。
import {
  HOME_FEATURED_PROMINENCE,
  type HomeFeaturedProminence,
} from "@stats47/data-configs/ranking-prominence";

import type { FeaturedRankingItem, FeaturedValue, RankingItem } from "../types/ranking-item";

/** 派生に必要な値行の最小形 (RankingValue の subset) */
export interface HomeFeaturedValueRow {
  areaCode: string;
  areaName: string;
  value: number | null;
  rank: number | null;
}

/** 既存 display 規則 (現行 exporter と同じ ja-JP ロケール整形) */
function formatValue(value: number | null): string | null {
  return value !== null ? value.toLocaleString("ja-JP") : null;
}

/**
 * 1 回の values read から1位を導出する。
 * - value が null の行は除外する
 * - rank 昇順の先頭を使う
 * - snapshot の実 rank を保持する
 */
export function deriveFeaturedTop(
  values: readonly HomeFeaturedValueRow[],
): FeaturedValue | null {
  const usable = values
    .filter((v) => v.value !== null && v.rank !== null)
    .slice()
    .sort((a, b) => (a.rank as number) - (b.rank as number));

  const toFeatured = (row: HomeFeaturedValueRow): FeaturedValue => ({
    rank: row.rank as number,
    areaName: row.areaName,
    value: formatValue(row.value),
  });

  return usable.length > 0 ? toFeatured(usable[0]) : null;
}

export interface ResolvedHomeFeatured {
  item: RankingItem;
  definition: HomeFeaturedProminence;
}

/**
 * 生成済みホーム注目の順で RankingItem を解決する。
 * active / prefecture / 実在を再検証し、満たさない定義は skip して missingKeys に返す
 * (生成物は isActive な metric からしか選ばないので通常 0 件。snapshot 側の欠落時に
 *  exporter を落とさないための保険)。
 */
export function resolveHomeFeaturedItems(
  items: readonly RankingItem[],
  definitions: readonly HomeFeaturedProminence[] = HOME_FEATURED_PROMINENCE,
): { resolved: ResolvedHomeFeatured[]; missingKeys: string[] } {
  const byKey = new Map<string, RankingItem>();
  for (const item of items) {
    if (item.areaType !== "prefecture") continue;
    if (!byKey.has(item.rankingKey)) byKey.set(item.rankingKey, item);
  }

  const resolved: ResolvedHomeFeatured[] = [];
  const missingKeys: string[] = [];
  for (const definition of [...definitions].sort((a, b) => a.order - b.order)) {
    const item = byKey.get(definition.rankingKey);
    if (!item || !item.isActive) {
      missingKeys.push(definition.rankingKey);
      continue;
    }
    resolved.push({ item, definition });
  }
  return { resolved, missingKeys };
}

/**
 * 1 item 分の焼き込み (仕様 §5.3 手順 3-8)。
 * generateSvg は注入する。
 * SVG 生成が throw しても1位とhomeFeaturedは保持する。
 */
export function bakeHomeFeaturedItem(input: {
  item: RankingItem;
  definition: HomeFeaturedProminence;
  values: readonly HomeFeaturedValueRow[];
  generateSvg: (rows: { areaCode: string; value: number; rank?: number }[]) => string;
}): FeaturedRankingItem {
  const { item, definition, values } = input;
  const featuredTop = deriveFeaturedTop(values);

  let tileMapSvg: string | null = null;
  try {
    tileMapSvg = input.generateSvg(
      values.flatMap((v) =>
        v.value !== null
          ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }]
          : [],
      ),
    );
  } catch {
    tileMapSvg = null; // map 生成失敗でも他派生値は保持 (仕様 §13.2)
  }

  return {
    ...item,
    featuredTop,
    tileMapSvg,
    homeFeatured: {
      order: definition.order,
      hook: definition.hook,
    },
  };
}
