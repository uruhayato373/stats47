'use client';

import { cn } from '@stats47/components';

import { RailNavRow, type RailNavRowDensity } from '@/components/surface';

import { trackNavClick, type NavSurface } from '@/lib/analytics/events';

export interface RailCategoryItem {
  categoryKey: string;
  categoryName: string;
  /** そのカテゴリの公開ランキング数 (記事数ではない)。showCount のときだけ表示する */
  count?: number;
}

interface RailCategoryListProps {
  /**
   * 表示するカテゴリ (表示順のまま)。既定値を持たない =
   * SSG ページで意図せず全 17 件を焼き込まないよう、呼び出し側が件数を決める。
   */
  items: readonly RailCategoryItem[];
  /** 件数を出す (意味は「ランキング数」で固定。記事数を渡さない) */
  showCount?: boolean;
  /** 現在地のカテゴリ。行を aria-current="page" + 強調にする */
  activeCategoryKey?: string;
  /** compact = レールの既定密度 / default = 本文中の一覧 */
  density?: RailNavRowDensity;
  /** GA4 nav_surface。ページごとに別の値を渡す (home と混ぜない) */
  trackingSurface: NavSurface;
  /** 末尾の「すべて見る」行。同じ行スタイルで最終行に置く */
  moreLink?: {
    href: string;
    label: string;
    trackingLabel?: string;
  };
  className?: string;
}

function track(label: string, href: string, surface: NavSurface) {
  try {
    trackNavClick({ label, href, surface });
  } catch {
    // 計測失敗で遷移を止めない。
  }
}

/**
 * カテゴリ導線の正 (home の高密度な縦型行 UI を昇格したもの)。
 *
 * - 単列。区切り線付きの行を `RailNavRow` で描く (独自 2 列 grid・チップを使わない)
 * - 枠 (RailCard) は持たない。呼び出し側が `<RailCard title="カテゴリから探す">` で包む
 *   (カード内カードを機械監査で見える形にするため)
 * - ページ名 variant を持たない。差分は density / showCount / activeCategoryKey / items / moreLink
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailCategoryList({
  items,
  showCount = true,
  activeCategoryKey,
  density = 'compact',
  trackingSurface,
  moreLink,
  className,
}: RailCategoryListProps) {
  return (
    <nav
      aria-label="カテゴリから探す"
      className={cn('divide-y divide-border border-y border-border', className)}
    >
      {items.map((category) => {
        const href = `/category/${category.categoryKey}`;
        const count =
          showCount && typeof category.count === 'number'
            ? category.count
            : undefined;
        return (
          <RailNavRow
            key={category.categoryKey}
            href={href}
            density={density}
            active={category.categoryKey === activeCategoryKey}
            trailing={
              count !== undefined ? (
                <>
                  {count.toLocaleString('ja-JP')}件
                  <span className="sr-only">のランキング</span>
                </>
              ) : undefined
            }
            onClick={() => track(category.categoryName, href, trackingSurface)}
          >
            {category.categoryName}
          </RailNavRow>
        );
      })}
      {moreLink && (
        <RailNavRow
          href={moreLink.href}
          density={density}
          className="font-semibold text-primary"
          onClick={() =>
            track(
              moreLink.trackingLabel ?? moreLink.label,
              moreLink.href,
              trackingSurface
            )
          }
        >
          {moreLink.label}
        </RailNavRow>
      )}
    </nav>
  );
}
