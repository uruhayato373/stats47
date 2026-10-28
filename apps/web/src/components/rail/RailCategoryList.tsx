'use client';

import { hrefFor } from '@stats47/data-configs/content/href';

import { RailNavRow } from '@/components/surface';

import { trackNavClick, type NavSurface } from '@/lib/analytics/events';

/** compact = レールの既定密度 / default = 本文中の一覧 */
export type RailCategoryDensity = 'compact' | 'default';

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
  density?: RailCategoryDensity;
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
 * - 単列。行は RailLinksCard の list 行と同じ RailNavRow (区切り線 + 右端の ChevronRight + モバイル 44px)
 * - 行はカードの本文余白 (16px) の中に置く。行の横余白は持たず (px-0)、呼び出し側は -mx-* で打ち消さない
 *   (2026-10-28 3 巡目。行の作りが RailLinksCard とずれ、矢印の大きさも違っていた)
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
    <nav aria-label="カテゴリから探す" className={className}>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((category) => {
          const href = hrefFor('category', { categoryKey: category.categoryKey });
          const count =
            showCount && typeof category.count === 'number'
              ? category.count
              : undefined;
          return (
            <li key={category.categoryKey}>
              <RailNavRow
                href={href}
                density={density}
                active={category.categoryKey === activeCategoryKey}
                className="px-0"
                onClick={() => track(category.categoryName, href, trackingSurface)}
                trailing={
                  count !== undefined ? (
                    <>
                      {count.toLocaleString('ja-JP')}件
                      <span className="sr-only">のランキング</span>
                    </>
                  ) : undefined
                }
              >
                {category.categoryName}
              </RailNavRow>
            </li>
          );
        })}
        {moreLink && (
          <li>
            <RailNavRow
              href={moreLink.href}
              density={density}
              className="px-0 font-semibold text-primary"
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
          </li>
        )}
      </ul>
    </nav>
  );
}
