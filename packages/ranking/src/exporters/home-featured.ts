/**
 * home/featured.json の派生値生成 (pure helper・仕様 doc 28 §5.3)。
 *
 * exporter (ranking-items-per-url-snapshot.ts) から呼ばれるが、R2/server-only に依存しない
 * 純関数として分離し、fixture だけで unit test できるようにする。
 * apps/web の dev 補完 (旧 snapshot 時の in-memory 補完) も同じ導出を使う (二重実装禁止)。
 */
import {
  HOME_FEATURED_RANKINGS,
  type HomeFeaturedRankingDefinition,
} from "@stats47/data-configs";

import type { FeaturedRankingItem, FeaturedValue, RankingItem } from "../types/ranking-item";

/** 派生に必要な値行の最小形 (RankingValue の subset) */
export interface HomeFeaturedValueRow {
  areaCode: string;
  areaName: string;
  value: number | null;
  rank: number | null;
}

export interface HomeFeaturedDerivedValues {
  featuredTop: FeaturedValue | null;
  featuredBottom: FeaturedValue | null;
  featuredTopThree: FeaturedValue[];
}

/** 既存 display 規則 (現行 exporter と同じ ja-JP ロケール整形) */
function formatValue(value: number | null): string | null {
  return value !== null ? value.toLocaleString("ja-JP") : null;
}

/**
 * 1 回の values read から top / bottom / top3 を導出する。
 * - value が null の行は除外する
 * - rank 昇順で top / topThree、末尾 (最大 rank) を bottom とする
 * - 同順位 (tie) があっても snapshot の実 rank を保持する (「47位」固定表示をしない)
 */
export function deriveHomeFeaturedValues(
  values: readonly HomeFeaturedValueRow[],
): HomeFeaturedDerivedValues {
  const usable = values
    .filter((v) => v.value !== null && v.rank !== null)
    .slice()
    .sort((a, b) => (a.rank as number) - (b.rank as number));

  const toFeatured = (row: HomeFeaturedValueRow): FeaturedValue => ({
    rank: row.rank as number,
    areaName: row.areaName,
    value: formatValue(row.value),
  });

  if (usable.length === 0) {
    return { featuredTop: null, featuredBottom: null, featuredTopThree: [] };
  }

  return {
    featuredTop: toFeatured(usable[0]),
    featuredBottom: toFeatured(usable[usable.length - 1]),
    featuredTopThree: usable.slice(0, 3).map(toFeatured),
  };
}

export interface ResolvedHomeFeatured {
  item: RankingItem;
  definition: HomeFeaturedRankingDefinition;
}

/**
 * HOME_FEATURED_RANKINGS の順で RankingItem を解決する (仕様 §5.3 手順 1-2)。
 * active / prefecture / 実在を再検証し、満たさない定義は skip して missingKeys に返す
 * (config validation が通っていれば通常 0 件。snapshot 側の欠落時に exporter を落とさない)。
 */
export function resolveHomeFeaturedItems(
  items: readonly RankingItem[],
  definitions: readonly HomeFeaturedRankingDefinition[] = HOME_FEATURED_RANKINGS,
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
 * generateSvg は注入 (server-only の generateMiniTileSvg を exporter が渡す)。
 * SVG 生成が throw しても他の派生値 (top/bottom/top3/homeFeatured) は保持する。
 */
export function bakeHomeFeaturedItem(input: {
  item: RankingItem;
  definition: HomeFeaturedRankingDefinition;
  values: readonly HomeFeaturedValueRow[];
  generateSvg: (rows: { areaCode: string; value: number; rank?: number }[]) => string;
}): FeaturedRankingItem {
  const { item, definition, values } = input;
  const derived = deriveHomeFeaturedValues(values);

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
    ...derived,
    tileMapSvg,
    homeFeatured: {
      order: definition.order,
      hook: definition.hook,
      variant: definition.variant,
    },
  };
}
