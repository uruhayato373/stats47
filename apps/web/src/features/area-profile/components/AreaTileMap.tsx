import Link from "next/link";

import { cn } from "@stats47/components";

import { regionStyle } from "../constants/region-styles";

import type { AreaTile } from "../utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface AreaTileMapProps {
  tiles: AreaTile[];
  gridCols: number;
  gridRows: number;
  regionLegend: { regionCode: string; regionName: string }[];
  /** タイルクリック時の計測フック（遷移は Link 自身が行う） */
  onSelect?: (tile: AreaTile) => void;
  className?: string;
}

/**
 * 都道府県選択用の軽量タイル地図（SSR 可能・全 47 県が初期 HTML に存在）。
 *
 * D3 / canvas を使わず、`TILE_GRID_LAYOUT`（座標 SSOT）を CSS Grid に配置した
 * Next `<Link>` の集合として描画する。JavaScript が失敗しても各タイルは通常のリンク
 * として県ページへ遷移できる。色は地方の categorical 色 + 凡例（地方名）で示し、
 * 色だけに意味を持たせない。
 */
export function AreaTileMap({
  tiles,
  gridCols,
  gridRows,
  regionLegend,
  onSelect,
  className,
}: AreaTileMapProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="group"
        aria-label="地図から都道府県を選ぶ"
        className="grid w-full gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
          aspectRatio: `${gridCols} / ${gridRows}`,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.prefCode}
            href={`/areas/${tile.prefCode}`}
            aria-label={`${tile.prefName}の統計を見る`}
            onClick={() => onSelect?.(tile)}
            style={{
              gridColumn: `${tile.x + 1} / span ${tile.w}`,
              gridRow: `${tile.y + 1} / span ${tile.h}`,
            }}
            className={cn(
              "flex items-center justify-center rounded-none px-0.5 text-center text-[11px] font-medium leading-none transition-colors",
              regionStyle(tile.regionCode).tile,
              FOCUS_RING,
            )}
          >
            <span aria-hidden="true">{tile.shortName}</span>
          </Link>
        ))}
      </div>

      {/* 凡例（色 + 地方名。色のみで地方を区別させない） */}
      <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="地方区分の凡例">
        {regionLegend.map((region) => (
          <li
            key={region.regionCode}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                "inline-block size-2.5 rounded-none",
                regionStyle(region.regionCode).swatch,
              )}
            />
            {region.regionName}
          </li>
        ))}
      </ul>
    </div>
  );
}
