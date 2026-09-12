'use client';

import { useId, useState } from 'react';

import Link from 'next/link';

import { cn } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';

import type { getGeoSourceNavigation } from '../lib/geo-source-navigation';

/** Receive the public list from the server without bundling the GIS registry. */
export function GeoSourceNavigationList({
  groups,
  currentDataId,
}: {
  groups: ReturnType<typeof getGeoSourceNavigation>;
  currentDataId?: string;
}) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const search = query.trim().normalize('NFKC').toLowerCase();
  const filtered = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      `${item.name} ${item.dataId} ${group.label} ${String(item.position).padStart(2, '0')}`
        .normalize('NFKC')
        .toLowerCase()
        .includes(search)
    ),
  }));
  const count = filtered.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <div className="mb-3 space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium">
          GIS名・番号で検索
        </label>
        <Input
          id={inputId}
          type="search"
          className="min-h-11"
          placeholder="学校・P29・防災など"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {search && (
          <div className="flex items-center justify-between gap-2">
            <p role="status" className="text-xs text-muted-foreground">
              {count}種類が見つかりました
            </p>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setQuery('')}
            >
              検索を解除
            </Button>
          </div>
        )}
        {!count && (
          <p className="text-sm">
            一致するGISがありません。名前や番号を変えてください。
          </p>
        )}
      </div>
      <div className="space-y-3">
        {filtered
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.category} aria-label={group.label}>
              <h3 className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </h3>
              <ol start={group.items[0].position}>
                {group.items.map((item) => (
                  <li
                    key={item.dataId}
                    value={item.position}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={
                        item.dataId === currentDataId ? 'true' : undefined
                      }
                      data-geo-source={item.dataId}
                      className={cn(
                        'flex min-h-11 items-center gap-2 px-2 py-2 text-sm leading-snug transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:min-h-8 xl:py-1.5',
                        item.dataId === currentDataId &&
                          'bg-accent font-semibold text-primary'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="w-5 shrink-0 text-xs leading-5 tabular-nums text-muted-foreground"
                      >
                        {String(item.position).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        {item.name}
                        {item.dataId === currentDataId && (
                          <span className="ml-1.5 inline-block text-xs">
                            表示中
                          </span>
                        )}
                        {item.status === 'preparing' && (
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            地図を準備中
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
      </div>
    </>
  );
}
