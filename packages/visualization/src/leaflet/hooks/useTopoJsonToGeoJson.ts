import { useMemo } from "react";
import * as topojson from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { TopoJSONTopology } from "@stats47/types";

/**
 * TopoJSON を GeoJSON FeatureCollection に変換（メモ化）
 *
 * MLIT/geoshape のプロパティ名を正規化:
 * - N03_007 → prefCode (XX000 形式)
 * - N03_001 → prefName
 * - N03_004 → cityName
 */
export function useTopoJsonToGeoJson(
  topology: TopoJSONTopology | null
): FeatureCollection<Geometry> | null {
  return useMemo(() => {
    if (!topology) return null;

    const objectName = Object.keys(topology.objects)[0];
    if (!objectName) return null;

    const fc = topojson.feature(
      topology as any,
      topology.objects[objectName] as any
    ) as unknown as FeatureCollection<Geometry>;

    // プロパティ正規化
    for (const feature of fc.features) {
      const props = feature.properties ?? {};

      // 都道府県コード
      if (props.N03_007 && !props.prefCode) {
        const raw = String(props.N03_007).padStart(2, "0");
        props.prefCode = raw.length <= 2 ? raw + "000" : raw;
      }

      // 都道府県名
      if (props.N03_001 && !props.prefName) {
        props.prefName = props.N03_001;
      }

      // 市区町村名
      if (props.N03_004 && !props.cityName) {
        props.cityName = props.N03_004;
      }

      feature.properties = props;
    }

    return fc;
  }, [topology]);
}
