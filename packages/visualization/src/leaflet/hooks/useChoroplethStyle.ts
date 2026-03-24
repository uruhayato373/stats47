import { useEffect, useState } from "react";
import type { PathOptions } from "leaflet";
import type { Feature, Geometry } from "geojson";

import { createChoroplethColorMapper } from "../../d3/utils/color-scale/create-choropleth-color-mapper";
import type { MapVisualizationConfig, MapDataPoint } from "../../d3/types/map-chart";

/**
 * 既存の createChoroplethColorMapper を Leaflet GeoJSON の style 関数に変換
 *
 * @param colorConfig - 色スケール設定
 * @param data - ランキングデータ
 * @param codeExtractor - Feature からエリアコードを抽出する関数
 * @param borderColor - 境界線の色
 */
export function useChoroplethStyle(
  colorConfig: MapVisualizationConfig,
  data: MapDataPoint[],
  codeExtractor: (feature: Feature<Geometry>) => string,
  borderColor: string = "#94a3b8"
): ((feature?: Feature<Geometry>) => PathOptions) | null {
  const [styleFactory, setStyleFactory] = useState<
    ((feature?: Feature<Geometry>) => PathOptions) | null
  >(null);

  useEffect(() => {
    if (data.length === 0) {
      setStyleFactory(null);
      return;
    }

    let cancelled = false;

    createChoroplethColorMapper(colorConfig, data).then((colorMapper) => {
      if (cancelled) return;
      setStyleFactory(() => (feature?: Feature<Geometry>): PathOptions => {
        if (!feature) {
          return { fillColor: "#e0e0e0", fillOpacity: 0.95, color: borderColor, weight: 0.5 };
        }
        const code = codeExtractor(feature);
        return {
          fillColor: colorMapper(code),
          fillOpacity: 0.95,
          color: borderColor,
          weight: 0.5,
        };
      });
    });

    return () => { cancelled = true; };
  }, [colorConfig, data, codeExtractor, borderColor]);

  return styleFactory;
}
