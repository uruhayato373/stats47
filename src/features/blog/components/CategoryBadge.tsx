/**
 * カテゴリバッジコンポーネント
 */

import { Badge } from "@/components/atoms/ui/badge";

/**
 * カテゴリバッジのプロパティ
 */
export interface CategoryBadgeProps {
  /** カテゴリキー */
  category: string;
  /** カテゴリ名（オプション、指定しない場合はcategoryキーから自動判定） */
  categoryName?: string;
  /** CSSクラス名 */
  className?: string;
}

/**
 * カテゴリバッジコンポーネント
 * 
 * カテゴリ名をバッジとして表示
 */
export function CategoryBadge({ category, categoryName, className }: CategoryBadgeProps) {
  // カテゴリ名のマッピング（フォールバック）
  const categoryNames: Record<string, string> = {
    population: "人口",
    agriculture: "農業",
    economy: "経済",
    environment: "環境",
    education: "教育",
    health: "健康",
    housing: "住宅",
    transport: "交通",
    culture: "文化",
    welfare: "福祉",
    "prefecture-rank": "都道府県ランキング",
  };

  const displayName = categoryName || categoryNames[category] || category;

  return (
    <Badge variant="secondary" className={className}>
      {displayName}
    </Badge>
  );
}

