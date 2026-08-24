import Link from 'next/link';

import { cn } from '@stats47/components';

interface Props {
  current: 'prefectures' | 'municipalities' | 'japan';
}

const ITEMS = [
  { key: 'prefectures', label: '都道府県', href: '/themes' },
  { key: 'municipalities', label: '市区町村', href: '/municipalities' },
  { key: 'japan', label: '日本', href: '/japan' },
] as const;

export function StatisticsScopeNav({ current }: Props) {
  return (
    <nav aria-label="統計の地域単位" className="mb-5 border-b border-border">
      <div className="flex gap-6 overflow-x-auto">
        {ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === current ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
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
