'use client';

import { cn } from '@stats47/components';

import { SectionHeader } from '@/components/section';
import { RailNavRowButton } from '@/components/surface';

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
    <nav aria-label="地方で絞り込む">
      <SectionHeader title="地方" as="h2" />
      <div className="border-t border-border">
        {options.map((option) => {
          const active = activeRegionCode === option.regionCode;
          const swatch =
            option.regionCode === 'all'
              ? null
              : regionStyle(option.regionCode).swatch;

          return (
            <RailNavRowButton
              key={option.regionCode}
              pressed={active}
              onClick={() => setActiveRegionCode(option.regionCode)}
            >
              <span className="flex min-w-0 items-center gap-2">
                {swatch && (
                  <span
                    aria-hidden="true"
                    className={cn('size-2.5 shrink-0', swatch)}
                  />
                )}
                <span className="truncate">{option.regionName}</span>
              </span>
            </RailNavRowButton>
          );
        })}
      </div>
    </nav>
  );
}
