"use client";

import { useMemo } from "react";

import { LeafletChoroplethMap } from "@stats47/visualization/leaflet";
import { TILE_OPTIONS_LIGHT } from "@stats47/visualization/leaflet/constants/tile-providers";

import type { MapDataPoint, MapVisualizationConfig } from "@stats47/visualization/d3";
import type { TopoJSONTopology } from "@stats47/types";

import type { DepopulationMedicalPref } from "../lib/types";

interface Props {
  topology: TopoJSONTopology | null;
  prefectures: DepopulationMedicalPref[];
  selectedPrefectureCode: string | null;
  onPrefectureClick: (code: string) => void;
}

/**
 * 過疎地域内 医療機関比率の都道府県 choropleth。
 * 既存 LeafletChoroplethMap を再利用し、ratio(%) を value にマップする。
 */
export function DepopulationChoroplethMap({
  topology,
  prefectures,
  selectedPrefectureCode,
  onPrefectureClick,
}: Props) {
  const tile = TILE_OPTIONS_LIGHT[0];

  // ratio (0-1) → パーセント値を choropleth の value にする
  const data: MapDataPoint[] = useMemo(
    () =>
      prefectures.map((p) => ({
        areaCode: p.prefCode,
        value: Math.round(p.ratio * 1000) / 10, // % 小数1桁
      })),
    [prefectures],
  );

  const colorConfig: MapVisualizationConfig = useMemo(
    () => ({
      colorScheme: "reds",
      colorSchemeType: "sequential" as const,
      isReversed: false,
      minValueType: "zero" as const,
    }),
    [],
  );

  return (
    <LeafletChoroplethMap
      topology={topology}
      data={data}
      colorConfig={colorConfig}
      tileUrl={tile.url}
      attribution={tile.attribution}
      unit="%"
      onPrefectureClick={onPrefectureClick}
      selectedPrefectureCode={selectedPrefectureCode}
      borderColor="#94a3b8"
      className="h-[420px] lg:h-[520px] rounded-md overflow-hidden"
    />
  );
}
