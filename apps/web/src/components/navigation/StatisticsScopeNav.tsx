import { type ReactNode } from 'react';

import { buttonVariants, cn } from '@stats47/components';

import Link from '@/components/atoms/SiteLink';


export type StatisticsScope = 'prefectures' | 'municipalities' | 'japan';

/** 主語ごとのリンク先の上書き。同じ主題のページがある主語だけを渡す (無ければ各主語の一覧へ)。 */
export type StatisticsScopeHrefs = Partial<Record<StatisticsScope, string>>;

export interface LinkRowNavItem {
  key: string;
  label: string;
  href: string;
  /** 現在のページ。aria-current="page" を付け、outline のボタンで示す */
  current?: boolean;
}

/**
 * ページを移る・ページ内へ飛ぶリンクの列 (統計の地域単位・県の目次・テーマの章)。
 * タブ (TabsList) の見た目にせず、テンプレートの Button (ghost・sm) を並べる。現在地だけ outline。
 * 狭い幅でも 1 行に保ち、はみ出す分は横スクロールにする。右端のフェードで続きがあることを示し、
 * 列の末尾に同じ幅の余白 (pr-8) を置いて、最後まで送ると最後の項目がフェードの外に出るようにする。
 * JS を持たない。
 */
export const LINK_ROW_SCROLL_CLASS = 'overflow-x-auto [scrollbar-width:none]';
export const LINK_ROW_LIST_CLASS = 'flex w-max items-center gap-1 pr-8';
const LINK_ROW_FADE_CLASS =
  'pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background';

export function linkRowItemClass(current = false) {
  return cn(
    buttonVariants({ variant: current ? 'outline' : 'ghost', size: 'sm' }),
    'shrink-0',
    !current && 'text-muted-foreground'
  );
}

/** 横スクロールの容器 + 右端のフェード。中身 (リンク列) は呼び出し側が渡す */
export function LinkRowFrame({
  label,
  className,
  children,
}: {
  /** nav の名前 (読み上げ用) */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} className={cn('relative w-full min-w-0', className)}>
      <div className={LINK_ROW_SCROLL_CLASS}>
        <div className={LINK_ROW_LIST_CLASS}>{children}</div>
      </div>
      <span aria-hidden className={LINK_ROW_FADE_CLASS} />
    </nav>
  );
}

export function LinkRowNav({
  label,
  items,
  className,
}: {
  /** nav の名前 (読み上げ用) */
  label: string;
  items: readonly LinkRowNavItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <LinkRowFrame label={label} className={className}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.current ? 'page' : undefined}
          data-slot="button"
          className={linkRowItemClass(item.current)}
        >
          {item.label}
        </Link>
      ))}
    </LinkRowFrame>
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
    // 現在地の項目も hrefs で上書きできる (/ranking の「47都道府県」は /themes ではなく /ranking 自身)
    href: hrefs?.[item.key] || item.href,
    current: item.key === current,
  }));

  if (variant === 'horizontal') {
    return <LinkRowNav label="統計の地域単位" items={items} className={cn('mb-4', className)} />;
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
