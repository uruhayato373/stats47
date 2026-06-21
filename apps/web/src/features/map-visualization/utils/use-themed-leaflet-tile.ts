"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    setCurrentTile(tileOptions[0]);
  }, [isDark, tileOptions]);

  return { currentTile, setCurrentTile, isDark };
}
