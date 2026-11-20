'use client';


import { cn } from '@stats47/components';
import { hrefFor } from '@stats47/data-configs/content/href';

import { SectionIndexLink } from '@/components/section/SectionIndexLink';

import { trackNavClick } from '@/lib/analytics/events';

import { AreaDirectoryList } from './AreaDirectoryList';
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
 * - full (/areas): 地図と一覧を常に両方描く。コンテナ幅 480px 以上は左右に並べ、狭い幅は地図の下に一覧を置く。
 *   一覧は押しやすさのため comfortable (各リンク 44px 以上)。
 * - embedded: 地図を常時表示し、コンテナ幅 768px 以上でコンパクト一覧を併記する。
 *
 * どちらも地図と一覧の県リンクを初期 HTML に持つ (47 県 × 2 組)。
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
  const trackingSurface = TRACKING_SURFACES[surface];

  const legend = regionGroups.map((r) => ({
    regionCode: r.regionCode,
    regionName: r.regionName,
  }));

  const onMapSelect = (tile: AreaTile) =>
    track(trackingSurface.map, hrefFor('area', { areaCode: tile.prefCode }), tile.prefName);
  const onListSelect = (prefCode: string, prefName: string) =>
    track(trackingSurface.list, hrefFor('area', { areaCode: prefCode }), prefName);

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
          {/* 一覧への導線は共通の SectionIndexLink (Button outline sm + lucide の矢印)。文字の「→」を書かない */}
          <SectionIndexLink href="/areas" className="mt-3 @md:hidden">
            都道府県一覧から選ぶ
          </SectionIndexLink>
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

  // 地図を最初から見せる (2026-11-20 オーナー決定)。タブの裏に置いた間は地図がほぼ押されなかった
  // (/areas の地図は週 0〜2 回、地図を最初から出すトップページは週 100 回超)。
  // 本文 480px 以上 (サイドバーのある PC・タブレット) は地図と一覧を左右に、スマホは地図の下に一覧を置く。
  // 768px で切ると、サイドバーを開いた幅 1044px の PC (本文 738px) で地図が幅いっぱいの縦積みになる。
  return (
    <div
      className={cn(
        'grid gap-6 @sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] @sm:items-start',
        className
      )}
    >
      <AreaTileMap
        tiles={tiles}
        gridCols={gridCols}
        gridRows={gridRows}
        regionLegend={legend}
        onSelect={onMapSelect}
      />
      <AreaDirectoryList regionGroups={regionGroups} onSelect={onListSelect} />
    </div>
  );
}
