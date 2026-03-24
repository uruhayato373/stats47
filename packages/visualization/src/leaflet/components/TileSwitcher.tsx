"use client";

import { useState } from "react";
import { TILE_OPTIONS_LIGHT, TILE_OPTIONS_DARK } from "../constants/tile-providers";
import type { TileProvider } from "../constants/tile-providers";

interface TileSwitcherProps {
  /** 現在のタイル変更時コールバック */
  onTileChange: (tile: TileProvider) => void;
  /** ダークモードかどうか */
  isDark?: boolean;
  /** 初期タイルインデックス（デフォルト: 0） */
  defaultIndex?: number;
  /** 配置位置 */
  position?: "bottom-left" | "bottom-right";
}

/**
 * タイル切替ボタン（地図上に配置）
 *
 * 地図コンポーネントの外側に absolute 配置する想定。
 * 使用例:
 * ```tsx
 * <div className="relative">
 *   <LeafletChoroplethMap tileUrl={tile.url} ... />
 *   <TileSwitcher onTileChange={setTile} />
 * </div>
 * ```
 */
export function TileSwitcher({
  onTileChange,
  isDark = false,
  defaultIndex = 0,
  position = "bottom-left",
}: TileSwitcherProps) {
  const options = isDark ? TILE_OPTIONS_DARK : TILE_OPTIONS_LIGHT;
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  const positionClass =
    position === "bottom-left"
      ? "bottom-2 left-2"
      : "bottom-6 right-2";

  return (
    <div
      className={`absolute ${positionClass} z-[500] flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border`}
    >
      {options.map((tile, i) => (
        <button
          key={tile.label}
          type="button"
          onClick={() => {
            setActiveIndex(i);
            onTileChange(tile);
          }}
          className={`px-2 py-1 text-[10px] rounded transition-colors ${
            i === activeIndex
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {tile.label}
        </button>
      ))}
    </div>
  );
}
