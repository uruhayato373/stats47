import Link from "next/link";

import { isOk, type AreaType } from "@stats47/types";
import { ArrowRight, ListOrdered } from "lucide-react";

import { SectionCard } from "@/components/surface";

import { readRankingItemsByCategory } from "@/features/ranking/server";

import { RANK_GOLD_TEXT } from "../../utils/rank-medal.palette";
import { getSidebarDetail } from "../RankingSidebar/select-sidebar-items";

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
    <SectionCard
      title="同カテゴリの関連ランキング"
      icon={<ListOrdered className="h-4 w-4 text-muted-foreground" />}
      headerAction={
        categoryKey ? (
          <Link
            href={`/category/${categoryKey}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            すべて見る
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const readerLabel = item.readerLabel ?? item.title;
          const detail = getSidebarDetail(item);
          return (
            <Link
              key={item.rankingKey}
              href={`/ranking/${item.rankingKey}`}
              className="group flex flex-col gap-1 rounded-none px-3 py-2.5 transition-colors hover:bg-accent/40"
            >
              <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                {readerLabel}
              </span>
              {detail && (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {detail}
                </span>
              )}
              {item.top1 && (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  <span className={`font-semibold ${RANK_GOLD_TEXT}`}>
                    {item.top1.rank ?? 1}位
                  </span>{" "}
                  {item.top1.areaName}{" "}
                  {item.top1.value ? (
                    <span className="font-semibold text-foreground">
                      {item.top1.value}{item.unit}
                    </span>
                  ) : null}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
