import Link from "next/link";

import type { RankingItem } from "@stats47/ranking";

import { cn } from "@stats47/components";


/**
 * ランキング項目カードのProps型定義
 */
interface RankingItemCardProps {
  /** ランキング項目データ */
  item: RankingItem;
  /** 現在表示中のランキングかどうか */
  isActive?: boolean;
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
  isActive = false,
}: RankingItemCardProps) {
  const rankingUrl = `/ranking/${item.rankingKey}`;

  // 表示する補足情報を収集
  const metadataItems: string[] = [];

  if (item.subtitle) {
    metadataItems.push(item.subtitle);
  }


  if (item.demographicAttr) {
    metadataItems.push(item.demographicAttr);
  }


  return (
    <Link
      href={rankingUrl}
      title={item.title}
      data-testid="ranking-item"
      className={cn(
        "block p-3 rounded-lg transition-colors",
        isActive
          ? "border-2 border-primary bg-primary/5 font-medium"
          : "border border-border hover:border-primary hover:bg-accent/50"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="space-y-2">
        {/* タイトル */}
        <h4 className="font-medium text-sm leading-tight">{item.title}</h4>

        {/* サブタイトルや補足情報 */}
        {metadataItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {metadataItems.map((meta, index) => (
              <span
                key={index}
                className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded"
              >
                {meta}
              </span>
            ))}
          </div>
        )}

      </div>
    </Link>
  );
}

