'use client';

import { cn } from '@stats47/components';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ChevronRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';

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

/** 行末の矢印。RailLinksCard の行 (RailNavRow) と同じ大きさ・色の「押せる行」の印 */
const rowChevron = (
  <ChevronRight
    aria-hidden="true"
    className="shrink-0 text-muted-foreground"
  />
);

/**
 * 行の class。テンプレートの SidebarMenuSubButton (h-7) に、モバイル 44px のタップ領域と
 * 現在地の強調 (bg-accent font-semibold text-primary) を足す。
 */
function rowClassName(density: RailCategoryDensity, isActive: boolean, className?: string) {
  return cn(
    // [&>svg]:size-3.5 = RailNavRow の矢印と同じ大きさ (SidebarMenuSubButton の既定 size-4 を上書き)
    'h-auto translate-x-0 justify-between [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
    density === 'compact'
      ? 'min-h-11 py-1.5 text-sm sm:min-h-9'
      : 'min-h-11 py-2 text-[15px] sm:min-h-10',
    isActive && 'bg-accent font-semibold text-primary',
    className
  );
}

/**
 * カテゴリ導線の正 (home の高密度な縦型行 UI を昇格したもの)。
 *
 * - 単列。テンプレートの SidebarMenu / SidebarMenuItem / SidebarMenuSubButton で行を描く
 *   (SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う)
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
    <nav aria-label="カテゴリから探す" className={cn('px-2 py-1', className)}>
      {/* 行は区切り線 + 右端の ChevronRight。RailLinksCard の list 行と同じ作り */}
      <SidebarMenu className="divide-y divide-border">
        {items.map((category) => {
          const href = hrefFor('category', { categoryKey: category.categoryKey });
          const count =
            showCount && typeof category.count === 'number'
              ? category.count
              : undefined;
          const isActive = category.categoryKey === activeCategoryKey;
          return (
            <SidebarMenuItem key={category.categoryKey}>
              <SidebarMenuSubButton
                isActive={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={rowClassName(density, isActive)}
                onClick={() => track(category.categoryName, href, trackingSurface)}
                render={<Link href={href} />}
              >
                <span className="min-w-0 flex-1 truncate">
                  {category.categoryName}
                </span>
                {count !== undefined && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {count.toLocaleString('ja-JP')}件
                    <span className="sr-only">のランキング</span>
                  </span>
                )}
                {rowChevron}
              </SidebarMenuSubButton>
            </SidebarMenuItem>
          );
        })}
        {moreLink && (
          <SidebarMenuItem>
            <SidebarMenuSubButton
              className={rowClassName(density, false, 'font-semibold text-primary')}
              onClick={() =>
                track(
                  moreLink.trackingLabel ?? moreLink.label,
                  moreLink.href,
                  trackingSurface
                )
              }
              render={<Link href={moreLink.href} />}
            >
              <span className="min-w-0 flex-1 truncate">{moreLink.label}</span>
              {rowChevron}
            </SidebarMenuSubButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </nav>
  );
}
