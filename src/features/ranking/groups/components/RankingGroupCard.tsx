"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
 * 個別のランキンググループカードコンポーネント
 *
 * ランキンググループの情報を表示し、クリックでグループのアイテムを表示します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキンググループカードのJSX要素
 */
export function RankingGroupCard({
  group,
  category,
  subcategory,
}: RankingGroupCardProps) {
  const searchParams = useSearchParams();
  const currentGroup = searchParams.get("group");
  const isActive = currentGroup === group.groupKey;

  const rankingUrl = `/${category}/${subcategory}/ranking?group=${group.groupKey}`;

  return (
    <Link
      href={rankingUrl}
      className={cn(
        "block p-3 rounded-lg border transition-colors",
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

        {group.icon && (
          <div className="text-xs text-muted-foreground">{group.icon}</div>
        )}
      </div>
    </Link>
  );
}

