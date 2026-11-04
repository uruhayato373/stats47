import { cn } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";
import { ChartLegend } from "@/components/charts/ChartLegend";

import { regionStyle } from "../constants/region-styles.palette";

import type { AreaTile } from "../utils";

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * 地方の色見本の Tailwind クラス (背景色のクラスと dark: の背景色のクラス) を、凡例に渡せる CSS の色の値にする。
 * 色の正本は region-styles.palette の swatch のまま。dark: は Tailwind 既定の
 * prefers-color-scheme なので、同じ切り替えをする light-dark() で写す。
 */
function swatchColor(swatchClass: string): string {
  const light = swatchClass.match(/(?:^|\s)bg-([\w-]+)/)?.[1];
  const dark = swatchClass.match(/(?:^|\s)dark:bg-([\w-]+)/)?.[1];
  const lightColor = `var(--color-${light ?? "muted-foreground"})`;
  return dark ? `light-dark(${lightColor}, var(--color-${dark}))` : lightColor;
}

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
    <div className={cn("@container flex flex-col gap-3", className)}>
      <div
        role="group"
        aria-label="地図から都道府県を選ぶ"
        className="grid w-full gap-px @sm:gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
          aspectRatio: `${gridCols} / ${gridRows}`,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.prefCode}
            href={hrefFor("area", { areaCode: tile.prefCode })}
            aria-label={`${tile.prefName}の統計を見る`}
            onClick={() => onSelect?.(tile)}
            style={{
              gridColumn: `${tile.x + 1} / span ${tile.w}`,
              gridRow: `${tile.y + 1} / span ${tile.h}`,
            }}
            className={cn(
              "flex items-center justify-center overflow-hidden whitespace-nowrap rounded-none text-center text-[9px] @sm:px-0.5 @sm:text-[11px] font-medium leading-none transition-colors",
              regionStyle(tile.regionCode).tile,
              FOCUS_RING,
            )}
          >
            {/* 1 マスに 3 文字は入らない (神奈川)。スマホの幅では 2 文字にし、正式名は aria-label が持つ */}
            <span aria-hidden="true" className="@sm:hidden">
              {tile.w === 1 ? tile.shortName.slice(0, 2) : tile.shortName}
            </span>
            <span aria-hidden="true" className="hidden @sm:inline">
              {tile.shortName}
            </span>
          </Link>
        ))}
      </div>

      {/* 凡例（色 + 地方名。色のみで地方を区別させない） */}
      <ChartLegend
        label="地方区分の凡例"
        className="gap-y-1 text-xs"
        items={regionLegend.map((region) => ({
          key: region.regionCode,
          label: region.regionName,
          color: swatchColor(regionStyle(region.regionCode).swatch),
        }))}
      />
    </div>
  );
}
