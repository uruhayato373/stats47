import { cn } from '@stats47/components';

import Link from '@/components/atoms/SiteLink';


export type StatisticsScope = 'prefectures' | 'municipalities' | 'japan';

/** 主語ごとのリンク先の上書き。同じ主題のページがある主語だけを渡す (無ければ各主語の一覧へ)。 */
export type StatisticsScopeHrefs = Partial<Record<StatisticsScope, string>>;

export interface TabsLinkNavItem {
  key: string;
  label: string;
  href: string;
  /** 現在のページ。aria-current="page" と data-active (選択中の見た目) を付ける */
  current?: boolean;
}

/**
 * テンプレートの TabsList / TabsTrigger (tabs.tsx の default variant) と同じ見た目のリンク列。
 * ページを移るナビなので Tabs (role="tab") ではなくリンクで描く。JS を持たない。
 * cn-tabs-* は style-lyra.used.css の抽出対象なので文字列のまま書く。
 * 狭い幅でも 1 行に保ち、はみ出す分は横スクロールにする。
 */
export const TABS_LINK_LIST_CLASS =
  'cn-tabs-list inline-flex h-8 w-max items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground';
export const TABS_LINK_TRIGGER_CLASS =
  'cn-tabs-trigger relative inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground';

export function TabsLinkNav({
  label,
  items,
  className,
}: {
  /** nav の名前 (読み上げ用) */
  label: string;
  items: readonly TabsLinkNavItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className={cn('max-w-full overflow-x-auto [scrollbar-width:none]', className)}>
      <div className={TABS_LINK_LIST_CLASS}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.current ? 'page' : undefined}
            data-active={item.current ? '' : undefined}
            className={TABS_LINK_TRIGGER_CLASS}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

interface StatisticsScopeNavProps {
  current: StatisticsScope;
  /** 横タブ（本文上部）または縦リスト（左レール）。リンク定義は共通。 */
  variant?: 'horizontal' | 'rail';
  className?: string;
  /** 同じ主題のページへのリンク先 (`scopeHrefsFor*Theme` の結果をサーバーで渡す)。 */
  hrefs?: StatisticsScopeHrefs;
}

const ITEMS = [
  { key: 'prefectures', label: '47都道府県', href: '/themes' },
  { key: 'municipalities', label: '市区町村', href: '/municipalities' },
  { key: 'japan', label: '日本', href: '/japan' },
] as const;

/**
 * 統計の主語（47都道府県 / 市区町村 / 日本）を切り替える共通ナビ。
 *
 * テーマ名やカテゴリ名とは別軸なので、各スコープのハブと詳細ページで同じ位置・同じ語彙を使う。
 * 未公開の「世界」はページができるまで項目を出さない (2026-09-25 UI 全面点検)。
 */
export function StatisticsScopeNav({
  current,
  variant = 'horizontal',
  className,
  hrefs,
}: StatisticsScopeNavProps) {
  const items = ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    href: (item.key !== current && hrefs?.[item.key]) || item.href,
    current: item.key === current,
  }));

  if (variant === 'horizontal') {
    return <TabsLinkNav label="統計の地域単位" items={items} className={cn('mb-4', className)} />;
  }

  return (
    <nav aria-label="統計の地域単位" className={className}>
      <p className="text-xs font-medium text-muted-foreground">比較単位</p>
      <div className="mt-1 border-y border-border">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.current ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center px-2 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50',
              item.current
                ? 'bg-accent font-semibold text-primary'
                : 'text-foreground hover:bg-accent/50 hover:text-primary'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
