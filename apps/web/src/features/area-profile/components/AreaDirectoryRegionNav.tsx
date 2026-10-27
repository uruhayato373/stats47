'use client';

import { cn } from '@stats47/components';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';

import { RailCard } from '@/components/surface';

import { regionStyle } from '../constants/region-styles.palette';

import { useAreaDirectoryRegion } from './AreaDirectoryRegionContext';

interface RegionOption {
  regionCode: string;
  regionName: string;
}

interface Props {
  regions: RegionOption[];
}

/**
 * `/areas` の左レール。本文内にあった地方フィルタを、カテゴリ・テーマと同じ
 * ページ内ナビの文法へ揃える。レール未表示幅では本文の全県一覧を使う。
 */
export function AreaDirectoryRegionNav({ regions }: Props) {
  const { activeRegionCode, setActiveRegionCode } = useAreaDirectoryRegion();
  const options = [
    { regionCode: 'all', regionName: 'すべての都道府県' },
    ...regions,
  ];

  // 行はテンプレートの SidebarMenu で描く。リンクではなく絞り込みなので button (aria-pressed) で描く。
  // SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う。
  return (
    <nav aria-label="地方で絞り込む">
      <RailCard title="地方" bodyClassName="p-0">
        <SidebarGroup className="p-2">
          <SidebarMenu>
            {options.map((option) => {
              const active = activeRegionCode === option.regionCode;
              const swatch =
                option.regionCode === 'all'
                  ? null
                  : regionStyle(option.regionCode).swatch;

              return (
                <SidebarMenuItem key={option.regionCode}>
                  <SidebarMenuSubButton
                    isActive={active}
                    aria-pressed={active}
                    className="h-auto min-h-11 w-full translate-x-0 py-1.5 sm:min-h-8"
                    onClick={() => setActiveRegionCode(option.regionCode)}
                    render={<button type="button" />}
                  >
                    {swatch && (
                      <span
                        aria-hidden="true"
                        className={cn('size-2.5 shrink-0', swatch)}
                      />
                    )}
                    <span>{option.regionName}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </RailCard>
    </nav>
  );
}
