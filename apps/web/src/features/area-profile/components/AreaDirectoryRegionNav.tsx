'use client';

import { cn } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';

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
 * `/areas` のページ内ナビ。本文の都道府県の一覧を地方で絞り込む。
 */
export function AreaDirectoryRegionNav({ regions }: Props) {
  const { activeRegionCode, setActiveRegionCode } = useAreaDirectoryRegion();
  const options = [
    { regionCode: 'all', regionName: 'すべての都道府県' },
    ...regions,
  ];

  // リンクではなく絞り込みなので button (aria-pressed) で描く。ページの目的は都道府県を選ぶことなので、
  // 縦に並べて検索欄を押し下げず、折り返すボタンにする (2026-11-04)。
  return (
    <nav aria-label="地方で絞り込む">
      <RailCard title="地方" bodyClassName="flex flex-wrap gap-2 p-4">
        {options.map((option) => {
          const active = activeRegionCode === option.regionCode;
          const swatch =
            option.regionCode === 'all'
              ? null
              : regionStyle(option.regionCode).swatch;

          return (
            <Button
              key={option.regionCode}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-pressed={active}
              className="min-h-11 sm:min-h-8"
              onClick={() => setActiveRegionCode(option.regionCode)}
            >
              {swatch && (
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 shrink-0', swatch)}
                />
              )}
              {option.regionName}
            </Button>
          );
        })}
      </RailCard>
    </nav>
  );
}
