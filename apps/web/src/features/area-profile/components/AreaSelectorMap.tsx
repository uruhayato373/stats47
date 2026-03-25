"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { REGIONS } from "@stats47/area";
import { TileGridMap } from "@stats47/visualization";
import type { MapDataPoint, SequentialMapVisualizationConfig } from "@stats47/visualization/d3";

/** 各都道府県に地域インデックスを割り当て */
const mapData: MapDataPoint[] = REGIONS.flatMap((region, idx) =>
  region.prefectures.map((code) => ({ areaCode: code, value: idx + 1 })),
);

const colorConfig: SequentialMapVisualizationConfig = {
  colorSchemeType: "sequential",
  colorScheme: "interpolateSpectral",
  minValueType: "data-min",
};

/**
 * 都道府県選択用タイルグリッドマップ
 * クリックで /areas/{areaCode} に遷移
 */
export function AreaSelectorMap() {
  const router = useRouter();

  const handleClick = useCallback(
    (areaCode: string) => {
      router.push(`/areas/${areaCode}`);
    },
    [router],
  );

  return (
    <div className="max-w-md mx-auto [&_rect.pref-box]:opacity-50">
      <TileGridMap
        data={mapData}
        colorConfig={colorConfig}
        onPrefectureClick={handleClick}
        unit=""
      />
    </div>
  );
}
