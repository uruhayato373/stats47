import { geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import type { Feature, FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { CityPathInfo } from "../population-choropleth/types";
import type { YoyRecord } from "./types";

export interface ProjectionConfig {
  width: number;
  height: number;
  /** 経度中心（度）。日本本土＋沖縄は 137.5°E あたりが見栄えが良い */
  center: [number, number];
  /** 縮尺。値が大きいほど拡大。1000x1200 → 2400, 1280x1000 → 2200 が出発点 */
  scale: number;
}

export function getProjection(
  format: "landscape" | "portrait",
  width: number,
  height: number,
) {
  if (format === "portrait") {
    return {
      width,
      height,
      // 北端 Hokkaido〜南端 Okinawa まで縦に並べる構図
      center: [136.5, 37.5] as [number, number],
      scale: Math.min(width * 2.6, height * 2.05),
    };
  }
  return {
    width,
    height,
    // 横長: Hokkaido〜Okinawa を斜めに対角配置
    center: [137.5, 37] as [number, number],
    scale: Math.min(width * 1.9, height * 2.3),
  };
}

export function createSharedColorScale(maxAbs: number) {
  return scaleDiverging(interpolateRdBu)
    .domain([1 - maxAbs, 1, 1 + maxAbs])
    .clamp(true);
}

/**
 * 47都道府県の本土に焦点を合わせた projection で paths を計算する。
 * fitExtent は使わず、center/scale を固定して東京の小笠原諸島が bbox を引き伸ばすのを防ぐ。
 */
export function computeYearPaths(
  topology: Topology,
  records: YoyRecord[],
  colorScale: (ratio: number) => string,
  config: ProjectionConfig,
): CityPathInfo[] {
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return [];

  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection,
  ) as FeatureCollection;

  const dataMap = new Map<string, YoyRecord>();
  for (const rec of records) dataMap.set(rec.areaCode, rec);

  const projection = geoMercator()
    .center(config.center)
    .scale(config.scale)
    .translate([config.width / 2, config.height / 2]);

  const pathGenerator = geoPath().projection(projection);

  return geojson.features.map((feat: Feature) => {
    const code: string = feat.properties?.N03_007 || "";
    const name: string = feat.properties?.N03_001 || "";
    const rec = dataMap.get(code);
    const fill = rec ? colorScale(rec.ratio) : "#e0e0e0";
    const pathString = pathGenerator(feat) || "";
    return {
      path: pathString,
      fill,
      areaCode: code,
      areaName: rec?.areaName ?? name,
      ratio: rec?.ratio ?? 1,
    };
  });
}
