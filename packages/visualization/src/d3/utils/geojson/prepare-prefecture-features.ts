/**
 * TopoJSONを都道府県Feature配列に変換
 *
 * TopoJSONからGeoJSONへの変換と都道府県情報の正規化を一括で行います。
 */

import {
  NATIONAL_AREA_CODE,
  prefCodeFromTopoProperties,
  to5DigitPrefCode,
} from "@stats47/area/area-code";
import type { TopoJSONTopology } from "@stats47/types";
import type { Feature, FeatureCollection } from "geojson";
import type { TopojsonModule } from "../../types/d3";
import type { PrefectureFeature } from "../../types/map-chart";

/**
 * TopoJSONを都道府県Feature配列に変換
 *
 * @param topojsonModule - TopoJSONモジュール
 * @param topology - TopoJSONトポロジーデータ
 * @returns 正規化された都道府県Feature配列
 */
export function preparePrefectureFeatures(
  topojsonModule: TopojsonModule,
  topology: TopoJSONTopology
): PrefectureFeature[] {
  // TopoJSONからGeoJSONに変換
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) {
    throw new Error("TopoJSON objects is empty");
  }

  const featureCollection = topojsonModule.feature(
    topology as Parameters<typeof topojsonModule.feature>[0],
    topology.objects[objectName] as Parameters<typeof topojsonModule.feature>[1]
  ) as FeatureCollection;

  // 都道府県情報を正規化
  return featureCollection.features.map((feature: Feature) => {
    const properties = feature.properties || {};

    const prefCode2 = prefCodeFromTopoProperties(properties);
    const prefCode = prefCode2 ? to5DigitPrefCode(prefCode2) : NATIONAL_AREA_CODE;

    const prefName =
      properties.N03_001 ||
      properties.prefName ||
      properties.name ||
      "不明";

    return {
      ...feature,
      properties: {
        ...properties,
        prefCode,
        prefName,
      },
    } as PrefectureFeature;
  });
}
