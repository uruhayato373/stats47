"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import type { RankingGroup } from "../types";

/**
 * ランキンググループカードのProps型定義
 */
interface RankingGroupCardProps {
  /** ランキンググループデータ */
  group: RankingGroup;
  /** カテゴリID */
  category: string;
  /** サブカテゴリID */
  subcategory: string;
}

/**
 * グループ内の最初のアイテム（display_order_in_groupが最小）を取得
 */
function getFirstItemByDisplayOrder(group: RankingGroup): string | null {
  if (group.items.length === 0) {
    return null;
  }

  // display_order_in_groupでソートして、最小のものを取得
  const sortedItems = [...group.items].sort(
    (a, b) => a.displayOrderInGroup - b.displayOrderInGroup
  );
  return sortedItems[0].rankingKey;
}

/**
 * 個別のランキンググループカードコンポーネント
 *
 * ランキンググループの情報を表示し、クリックでグループ内の最初のアイテムに遷移します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキンググループカードのJSX要素
 */
export function RankingGroupCard({
  group,
  category,
  subcategory,
}: RankingGroupCardProps) {
  const pathname = usePathname();
  
  // グループ内の最初のアイテム（display_order_in_groupが最小）を取得
  const firstItemKey = getFirstItemByDisplayOrder(group);
  
  // 現在のパスがこのグループのアイテムのパスかどうかをチェック
  const isActive = firstItemKey
    ? pathname === `/${category}/${subcategory}/ranking/${firstItemKey}`
    : false;

  // アイテムがない場合はリンクを無効化
  const rankingUrl = firstItemKey
    ? `/${category}/${subcategory}/ranking/${firstItemKey}`
    : "#";

  return (
    <Link
      href={rankingUrl}
      className={cn(
        "block p-3 rounded-lg border transition-colors",
        !firstItemKey && "opacity-50 cursor-not-allowed",
        isActive
          ? "border-primary bg-primary/10 hover:bg-primary/20"
          : "border-border hover:border-primary hover:bg-accent/50"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">
            {group.label || group.name}
          </h4>
          {group.items.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {group.items.length}項目
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

