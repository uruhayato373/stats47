'use client';

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

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type AreaSurface = 'areas_map' | 'areas_list';

function track(surface: AreaSurface, href: string, label: string) {
  try {
    trackNavClick({ label, href, surface });
  } catch {
    // analytics 失敗で遷移を止めない
  }
}

interface AreaSelectionPanelsProps extends AreaDirectoryData {
  className?: string;
}

/**
 * `/areas` の選択パネル（レスポンシブ・計測の合流点）。
 *
 * - デスクトップ（lg 以上）: 「軽量タイル地図 + 地方別ディレクトリ」の 2 ペイン。
 *   xl 以上の地方フィルタは PageShell の左レール `AreaDirectoryRegionNav` が担う。
 * - モバイル / タブレット（lg 未満）: 既定タブ「一覧から探す」+ 任意タブ「地図から探す」。
 *
 * デスクトップペインは lg 未満でも DOM に存在（display:none）するため、全 47 県リンクは
 * 常に初期 HTML に含まれる。計測は既存 nav_click を導線別（areas_map / areas_list）で送る。
 */
export function AreaSelectionPanels({
  regionGroups,
  tiles,
  gridCols,
  gridRows,
  className,
}: AreaSelectionPanelsProps) {
  const { activeRegionCode, setActiveRegionCode } = useAreaDirectoryRegion();

  const legend = regionGroups.map((r) => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
  }));

  const onMapSelect = (tile: AreaTile) =>
    track('areas_map', `/areas/${tile.prefCode}`, tile.prefName);
  const onListSelect = (prefCode: string, prefName: string) =>
    track('areas_list', `/areas/${prefCode}`, prefName);

  const filters = [
    { code: 'all', name: 'すべて' },
    ...regionGroups.map((r) => ({ code: r.regionCode, name: r.regionName })),
  ];

  return (
    <div className={className}>
      {/* デスクトップ: 2 ペイン */}
      <div className="hidden gap-8 lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start">
        <AreaTileMap
          tiles={tiles}
          gridCols={gridCols}
          gridRows={gridRows}
          regionLegend={legend}
          onSelect={onMapSelect}
        />
        <div>
          {/* lg〜xl は左レールがまだ出ないため、同じ地方フィルタを本文側に残す。 */}
          <div
            role="group"
            aria-label="地方で絞り込む"
            className="mb-4 flex flex-wrap gap-1.5 xl:hidden"
          >
            {filters.map((filter) => {
              const active = activeRegionCode === filter.code;
              return (
                <button
                  key={filter.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveRegionCode(filter.code)}
                  className={cn(
                    'min-h-9 rounded-none border px-3 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-muted',
                    FOCUS_RING
                  )}
                >
                  {filter.name}
                </button>
              );
            })}
          </div>
          <AreaDirectoryList
            regionGroups={regionGroups}
            activeRegionCode={activeRegionCode}
            onSelect={onListSelect}
          />
        </div>
      </div>

      {/* モバイル / タブレット: タブ切替（既定=一覧） */}
      <div className="lg:hidden">
        <Tabs defaultValue="list">
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value="list" className="min-h-11">
              一覧から探す
            </TabsTrigger>
            <TabsTrigger value="map" className="min-h-11">
              地図から探す
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <AreaDirectoryList
              regionGroups={regionGroups}
              onSelect={onListSelect}
            />
          </TabsContent>
          <TabsContent value="map">
            <AreaTileMap
              tiles={tiles}
              gridCols={gridCols}
              gridRows={gridRows}
              regionLegend={legend}
              onSelect={onMapSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
