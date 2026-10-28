'use client';

import { useId, useState } from 'react';


import { cn } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';

import Link from '@/components/atoms/SiteLink';

import { navSurfaceProps } from '@/lib/analytics/events';

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
      <div className="-mx-2">
        {filtered
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <SidebarGroup key={group.category} role="group" aria-label={group.label} className="px-0 py-1">
              <SidebarGroupLabel render={<h3 />} className="justify-between gap-2 font-semibold text-muted-foreground">
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isCurrent = item.dataId === currentDataId;
                  return (
                    <SidebarMenuItem key={item.dataId}>
                      {/* SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う */}
                      <SidebarMenuSubButton
                        {...navSurfaceProps('geo_source_list')}
                        isActive={isCurrent}
                        aria-current={isCurrent ? 'page' : undefined}
                        data-geo-source={item.dataId}
                        className={cn(
                          'h-auto min-h-11 translate-x-0 items-start py-2 leading-snug xl:min-h-8 xl:py-1.5',
                          isCurrent && 'font-semibold text-primary'
                        )}
                        render={<Link href={item.href} prefetch={false} />}
                      >
                        <span
                          aria-hidden="true"
                          className="w-5 shrink-0 text-xs leading-5 tabular-nums text-muted-foreground"
                        >
                          {String(item.position).padStart(2, '0')}
                        </span>
                        {/* 名前は折り返す。SidebarMenuSubButton は最後の span を truncate するので div で包む */}
                        <div className="min-w-0 flex-1 wrap-break-word">
                          {item.name}
                          {isCurrent && (
                            <span className="ml-1.5 inline-block text-xs">
                              表示中
                            </span>
                          )}
                          {item.status === 'preparing' && (
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              地図を準備中
                            </span>
                          )}
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
      </div>
    </>
  );
}
