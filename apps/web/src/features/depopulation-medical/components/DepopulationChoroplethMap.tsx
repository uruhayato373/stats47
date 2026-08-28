"use client";

import { useMemo } from "react";

import { LeafletChoroplethMap } from "@stats47/visualization/leaflet";

import {
  getLeafletBorderColor,
  useThemedLeafletTile,
} from "@/features/map-visualization/client";

import { useTheme } from "@/hooks/useTheme";

import type { DepopulationMedicalPref } from "../lib/types";
import type { TopoJSONTopology } from "@stats47/types";
import type { MapDataPoint, MapVisualizationConfig } from "@stats47/visualization/d3";


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
  const { theme } = useTheme();
  const { currentTile } = useThemedLeafletTile(theme);

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
      colorScheme: "interpolateReds",
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
      tileUrl={currentTile.url}
      attribution={currentTile.attribution}
      unit="%"
      onPrefectureClick={onPrefectureClick}
      selectedPrefectureCode={selectedPrefectureCode}
      borderColor={getLeafletBorderColor(theme)}
      className="h-[420px] lg:h-[520px] rounded-md overflow-hidden"
    />
  );
}
