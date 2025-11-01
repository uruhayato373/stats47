import Link from "next/link";

import { Badge } from "@/components/atoms/ui/badge";

import type { RankingItem } from "../types";

/**
 * ランキング項目カードのProps型定義
 */
interface RankingItemCardProps {
  /** ランキング項目データ */
  item: RankingItem;
  /** カテゴリID */
  category: string;
  /** サブカテゴリID */
  subcategory: string;
}

/**
 * 個別のランキング項目カードコンポーネント
 *
 * ランキング項目の情報を表示し、クリックでランキング詳細ページに遷移します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキング項目カードのJSX要素
 */
export function RankingItemCard({
  item,
  category,
  subcategory,
}: RankingItemCardProps) {
  const rankingUrl = `/${category}/${subcategory}/ranking/${item.rankingKey}`;

  return (
    <Link
      href={rankingUrl}
      className="block p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">{item.label}</h4>
          <Badge variant="secondary" className="text-xs shrink-0">
            {item.unit}
          </Badge>
        </div>

        {item.description && item.description !== "null" && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">
            {item.rankingDirection === "desc" ? "降順" : "昇順"}
          </span>
        </div>
      </div>
    </Link>
  );
}
