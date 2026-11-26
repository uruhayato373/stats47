
import { PanelGrid } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { metricShortName } from "@stats47/ranking";
import { isOk, type AreaType } from "@stats47/types";
import { ListOrdered } from "lucide-react";

import { SectionHeader, SectionIndexLink } from "@/components/section";
import { CardGrid } from "@/components/surface";

import { readRankingItemsByCategory } from "@/features/ranking/server";
import { yearCodeOf } from "@/features/survey";

import { navSurfaceProps } from "@/lib/analytics/events";

import { RelatedRankingMapLoader } from "./RelatedRankingMapLoader";

/** 格子が 1 列 (スマホ) のときに出す枚数 (2026-11-26 オーナー判断。9 枚が縦に並ぶと長すぎた) */
const SINGLE_COLUMN_LIMIT = 3;

interface RelatedRankingsGridProps {
  /** 現在表示中の rankingKey (除外用) */
  rankingKey: string;
  /** カテゴリキー (同カテゴリ内の関連ランキング取得) */
  categoryKey?: string;
  /** areaType */
  areaType: AreaType;
  /** 表示件数 (default: 8) */
  limit?: number;
}

/**
 * 同カテゴリの関連ランキング grid (本文中段用)。注目ランキングと同じ地図付きのカードを記事と同じ格子 (CardGrid) に並べる (2026-11-26 オーナー判断)
 *
 * /ranking 詳細ページの AI 考察セクション直後に配置し、内部リンク密度を上げる。
 * sidebar (RankingItemsSidebar) と重複するが、本文中段にも展開することで:
 * - Google bot の内部リンク発見率↑
 * - sidebar を閉じている read mode でも回遊可能
 * - クロール budget の効率改善 (GSC 未indexed URL の indexation 促進)
 */
export async function RelatedRankingsGrid({
  rankingKey,
  categoryKey,
  limit = 8,
}: RelatedRankingsGridProps) {
  if (!categoryKey) return null;

  const result = await readRankingItemsByCategory(categoryKey);
  if (!isOk(result)) return null;

  // 現在のランキングを除いた上位 limit 件 (最新年の無い指標は地図を作れないので出さない)
  const items = result.data
    .filter((item) => item.rankingKey !== rankingKey && yearCodeOf(item.latestYear))
    .slice(0, limit);

  if (items.length === 0) return null;

  // カードの格子を含むセルは余白を持たないので、SectionCard に入れず、見出しと格子を別のセルにした格子の節にする (調査ハブと同じ)
  return (
    <PanelGrid as="section" aria-labelledby="related-rankings-title" {...navSurfaceProps("ranking_related")}>
      <SectionHeader
        title={<span id="related-rankings-title">同カテゴリの関連ランキング</span>}
        icon={<ListOrdered />}
        action={<SectionIndexLink href={hrefFor("category", { categoryKey })}>すべて見る</SectionIndexLink>}
        hideRule
      />
      <CardGrid>
        {items.map((item, index) => (
          <RelatedRankingMapLoader
            key={item.rankingKey}
            rankingKey={item.rankingKey}
            hook={metricShortName(item)}
            year={yearCodeOf(item.latestYear) ?? ""}
            hiddenWhenSingleColumn={index >= SINGLE_COLUMN_LIMIT}
          />
        ))}
      </CardGrid>
    </PanelGrid>
  );
}
