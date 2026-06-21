"use client";

import { useState } from "react";

import {
  TILE_OPTIONS_DARK,
  TILE_OPTIONS_LIGHT,
  type TileProvider,
} from "@stats47/visualization/leaflet/constants";

export function useThemedLeafletTile(theme: string | undefined): {
  currentTile: TileProvider;
  setCurrentTile: (tile: TileProvider) => void;
  isDark: boolean;
} {
  const isDark = theme === "dark";
  const tileOptions = isDark ? TILE_OPTIONS_DARK : TILE_OPTIONS_LIGHT;
  const [currentTile, setCurrentTile] = useState<TileProvider>(tileOptions[0]);

  // theme 切替時に既定タイルへリセット (effect で setState せず、レンダー中に前回値と比較して調整する
  // React 公式推奨パターン: https://react.dev/learn/you-might-not-need-an-effect)。手動選択は維持。
  const [prevIsDark, setPrevIsDark] = useState(isDark);
  if (prevIsDark !== isDark) {
    setPrevIsDark(isDark);
    setCurrentTile(tileOptions[0]);
  }

  return { currentTile, setCurrentTile, isDark };
}
