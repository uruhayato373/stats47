'use client';

import { cn } from '@stats47/components';
import { ChevronRight } from 'lucide-react';

import { SectionHeader } from '@/components/section';

import { regionStyle } from '../constants/region-styles';

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

  return (
    <nav aria-label="地方で絞り込む" className="pr-1">
      <SectionHeader title="地方" as="h2" />
      <div className="grid grid-cols-1 border-t border-border">
        {options.map((option) => {
          const active = activeRegionCode === option.regionCode;
          const swatch =
            option.regionCode === 'all'
              ? null
              : regionStyle(option.regionCode).swatch;

          return (
            <button
              key={option.regionCode}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveRegionCode(option.regionCode)}
              className={cn(
                'group flex min-h-9 w-full items-center gap-2 border-b border-border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                active ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              {swatch && (
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 shrink-0', swatch)}
                />
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 text-[13px]',
                  active
                    ? 'font-semibold text-primary'
                    : 'font-medium text-foreground group-hover:text-primary'
                )}
              >
                {option.regionName}
              </span>
              <ChevronRight
                className={cn(
                  'size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-primary'
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
