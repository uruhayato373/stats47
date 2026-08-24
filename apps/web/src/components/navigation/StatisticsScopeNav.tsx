import Link from 'next/link';

import { cn } from '@stats47/components';

export type StatisticsScope = 'prefectures' | 'municipalities' | 'japan';

interface StatisticsScopeNavProps {
  current: StatisticsScope;
  className?: string;
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
 */
export function StatisticsScopeNav({
  current,
  className,
}: StatisticsScopeNavProps) {
  return (
    <nav
      aria-label="統計の地域単位"
      className={cn('mb-5 border-b border-border', className)}
    >
      <div className="flex gap-6 overflow-x-auto">
        {ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === current ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              item.key === current
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
        <span className="shrink-0 border-b-2 border-transparent px-1 py-3 text-sm text-muted-foreground/60">
          世界（準備中）
        </span>
      </div>
    </nav>
  );
}
