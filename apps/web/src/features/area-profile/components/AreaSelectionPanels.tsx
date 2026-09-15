'use client';

import Link from 'next/link';

import { cn } from '@stats47/components';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@stats47/components/atoms/ui/tabs';

import { trackNavClick } from '@/lib/analytics/events';

import { AreaDirectoryList } from './AreaDirectoryList';
import { useAreaDirectoryRegion } from './AreaDirectoryRegionContext';
import { AreaTileMap } from './AreaTileMap';

import type { AreaDirectoryData, AreaTile } from '../utils';

export type PrefectureNavigatorSurface = 'areas' | 'home' | 'category';
type AreaSurface = Parameters<typeof trackNavClick>[0]['surface'];

const TRACKING_SURFACES: Record<
  PrefectureNavigatorSurface,
  { map: AreaSurface; list: AreaSurface }
> = {
  areas: { map: 'areas_map', list: 'areas_list' },
  home: { map: 'home_area_map', list: 'home_area_list' },
  category: { map: 'category_area_map', list: 'category_area_list' },
};

function track(surface: AreaSurface, href: string, label: string) {
  try {
    trackNavClick({ label, href, surface });
  } catch {
    // analytics 失敗で遷移を止めない
  }
}

interface AreaSelectionPanelsProps extends AreaDirectoryData {
  variant?: 'embedded' | 'full';
  surface: PrefectureNavigatorSurface;
  className?: string;
}

/**
 * 都道府県選択パネル（レスポンシブ・計測の合流点）。
 *
 * - full: 画面幅にかかわらず一覧/地図をタブで切り替え、選択中の一方だけを描画する。
 * - embedded: 地図を常時表示し、コンテナ幅 768px 以上でコンパクト一覧を併記する。
 *   PageShell のレール表示幅では `AreaDirectoryRegionNav` が地方フィルタを担う。
 *
 * 初期HTMLには既定の一覧だけを描画し、47県リンクを1組に保つ。
 * 計測は既存 nav_click を配置・導線別の surface で送る。
 */
export function AreaSelectionPanels({
  regionGroups,
  tiles,
  gridCols,
  gridRows,
  variant = 'full',
  surface,
  className,
}: AreaSelectionPanelsProps) {
  const { activeRegionCode } = useAreaDirectoryRegion();
  const trackingSurface = TRACKING_SURFACES[surface];

  const legend = regionGroups.map((r) => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
  }));

  const onMapSelect = (tile: AreaTile) =>
    track(trackingSurface.map, `/areas/${tile.prefCode}`, tile.prefName);
  const onListSelect = (prefCode: string, prefName: string) =>
    track(trackingSurface.list, `/areas/${prefCode}`, prefName);

  if (variant === 'embedded') {
    return (
      <div
        className={cn(
          'grid gap-6 @md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]',
          className
        )}
      >
        <div>
          <AreaTileMap
            tiles={tiles}
            gridCols={gridCols}
            gridRows={gridRows}
            regionLegend={legend}
            onSelect={onMapSelect}
          />
          <Link
            href="/areas"
            className="mt-3 inline-flex min-h-8 items-center text-sm font-semibold text-primary hover:underline @md:hidden"
          >
            都道府県一覧から選ぶ →
          </Link>
        </div>
        <AreaDirectoryList
          regionGroups={regionGroups}
          density="compact"
          onSelect={onListSelect}
          className="hidden @md:flex"
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="list" className={className}>
      <TabsList className="grid h-auto w-full grid-cols-2">
        <TabsTrigger value="list" className="min-h-11">
          一覧から探す
        </TabsTrigger>
        <TabsTrigger value="map" className="min-h-11">
          地図から探す
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-4">
        <AreaDirectoryList
          regionGroups={regionGroups}
          activeRegionCode={activeRegionCode}
          onSelect={onListSelect}
        />
      </TabsContent>
      <TabsContent value="map" className="mt-4">
        <AreaTileMap
          tiles={tiles}
          gridCols={gridCols}
          gridRows={gridRows}
          regionLegend={legend}
          onSelect={onMapSelect}
        />
      </TabsContent>
    </Tabs>
  );
}
