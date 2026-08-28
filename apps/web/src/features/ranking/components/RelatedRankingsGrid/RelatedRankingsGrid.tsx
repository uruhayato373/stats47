import Link from "next/link";

import { isOk, type AreaType } from "@stats47/types";
import { ArrowRight, ListOrdered } from "lucide-react";

import { SurfaceCard, SurfaceLinkCard } from "@/components/surface";

import { readRankingItemsByCategory } from "@/features/ranking/server";

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
 * 同カテゴリの関連ランキング grid (本文中段用)
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

  // 現在のランキングを除いた上位 limit 件
  const items = result.data
    .filter((item) => item.rankingKey !== rankingKey)
    .slice(0, limit);

  if (items.length === 0) return null;

  return (
    <SurfaceCard className="p-0">
      <div className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">同カテゴリの関連ランキング</h3>
        </div>
        {categoryKey && (
          <Link
            href={`/category/${categoryKey}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            すべて見る
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const readerLabel = item.readerLabel ?? item.title;
            const title = item.subtitle
              ? `${readerLabel}（${item.subtitle}）`
              : readerLabel;
            const subtitle = [item.demographicAttr, item.normalizationBasis]
              .filter(Boolean)
              .join(" / ");
            return (
              <SurfaceLinkCard
                key={item.rankingKey}
                href={`/ranking/${item.rankingKey}`}
                className="group flex flex-col gap-1 px-3 py-2.5"
              >
                <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                  {title}
                </span>
                {subtitle && (
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">
                    {subtitle}
                  </span>
                )}
              </SurfaceLinkCard>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}
