'use client';

import { cn } from '@stats47/components';

import { SingleSelectToggleGroup } from '@/components/molecules/SingleSelectToggleGroup';
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

  return (
    <nav aria-label="地方で絞り込む">
      <RailCard title="地方" bodyClassName="p-4">
        <SingleSelectToggleGroup
          aria-label="地方"
          value={activeRegionCode}
          onValueChange={setActiveRegionCode}
          options={options.map(option => ({
            value: option.regionCode,
            label: <>
              {option.regionCode !== 'all' && (
                <span aria-hidden="true" className={cn('size-2.5 shrink-0', regionStyle(option.regionCode).swatch)} />
              )}
              {option.regionName}
            </>,
          }))}
        />
      </RailCard>
    </nav>
  );
}
