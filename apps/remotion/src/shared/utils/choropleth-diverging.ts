import { geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import type { Feature, FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { CityPathInfo, PopulationRecord } from "../../features/population-choropleth/types";

export interface DivergingChoroplethOptions {
  width?: number;
  height?: number;
  /** データなし時の色 */
  noDataColor?: string;
  /** padding (default: 20) */
  padding?: number;
  /** fitExtent 前に除外するコード一覧（東京島嶼部など） */
  excludeCodes?: Set<string>;
}

/**
 * Diverging カラースケール対応コロプレスパス計算
 *
 * ratio = 1.0 を中心に RdBu で着色。
 * ratio < 1.0 は赤（減少）、ratio > 1.0 は青（増加）。
 * 対称化: maxAbs = max(|min-1|, |max-1|) で色強度を公平化。
 */
export function computeDivergingChoroplethPaths(
  topology: Topology,
  data: PopulationRecord[],
  options: DivergingChoroplethOptions = {},
): CityPathInfo[] {
  const {
    width = 1000,
    height = 1000,
    noDataColor = "#e0e0e0",
    padding = 20,
    excludeCodes = new Set<string>(),
  } = options;

  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return [];

  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection,
  ) as FeatureCollection;

  // データマップ構築
  const dataMap = new Map<string, PopulationRecord>();
  for (const rec of data) {
    dataMap.set(rec.areaCode, rec);
  }

  // fitExtent 用: 除外コード以外のフィーチャーで投影を決定
  const featuresForFit = geojson.features.filter((feat: Feature) => {
    const code = feat.properties?.N03_007 || "";
    return !excludeCodes.has(code);
  });

  const fitCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: featuresForFit,
  };

  // Diverging カラースケール（対称化）
  const ratios = data.map((d) => d.ratio);
  const minRatio = Math.min(...ratios);
  const maxRatio = Math.max(...ratios);
  const maxAbs = Math.max(Math.abs(minRatio - 1), Math.abs(maxRatio - 1));

  // RdBu: 0=赤, 0.5=白, 1=青
  // ratio < 1 (減少) → 赤, ratio > 1 (増加) → 青
  const colorScale = scaleDiverging(interpolateRdBu).domain([
    1 - maxAbs,
    1,
    1 + maxAbs,
  ]);

  // 投影
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    fitCollection,
  );

  const pathGenerator = geoPath().projection(projection);

  // パス生成
  return geojson.features
    .filter((feat: Feature) => {
      const code = feat.properties?.N03_007 || "";
      return !excludeCodes.has(code);
    })
    .map((feat: Feature) => {
      const code: string = feat.properties?.N03_007 || "";
      const name: string = feat.properties?.N03_004 || "";
      const rec = dataMap.get(code);
      const fill = rec ? colorScale(rec.ratio) : noDataColor;
      const pathString = pathGenerator(feat) || "";
      const ratio = rec?.ratio ?? 1;

      return { path: pathString, fill, areaCode: code, areaName: name, ratio };
    });
}

/**
 * 共通ドメインを計算（両都府県を結合して min/max を決定）
 */
export function computeSharedDomain(
  ...datasets: PopulationRecord[][]
): { min: number; max: number; maxAbs: number } {
  const allRatios = datasets.flatMap((d) => d.map((r) => r.ratio));
  const min = Math.min(...allRatios);
  const max = Math.max(...allRatios);
  const maxAbs = Math.max(Math.abs(min - 1), Math.abs(max - 1));
  return { min, max, maxAbs };
}

/**
 * 共通ドメインを使ったカラースケール生成
 */
export function createSharedColorScale(maxAbs: number) {
  return scaleDiverging(interpolateRdBu).domain([1 - maxAbs, 1, 1 + maxAbs]);
}

/**
 * 共通ドメインでパス計算（カラースケールを外部から注入）
 */
export function computeDivergingPathsWithScale(
  topology: Topology,
  data: PopulationRecord[],
  colorScale: (ratio: number) => string,
  options: DivergingChoroplethOptions = {},
): CityPathInfo[] {
  const {
    width = 1000,
    height = 1000,
    noDataColor = "#e0e0e0",
    padding = 20,
    excludeCodes = new Set<string>(),
  } = options;

  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return [];

  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection,
  ) as FeatureCollection;

  const dataMap = new Map<string, PopulationRecord>();
  for (const rec of data) {
    dataMap.set(rec.areaCode, rec);
  }

  const featuresForFit = geojson.features.filter((feat: Feature) => {
    const code = feat.properties?.N03_007 || "";
    return !excludeCodes.has(code);
  });

  const fitCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: featuresForFit,
  };

  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    fitCollection,
  );

  const pathGenerator = geoPath().projection(projection);

  return geojson.features
    .filter((feat: Feature) => {
      const code = feat.properties?.N03_007 || "";
      return !excludeCodes.has(code);
    })
    .map((feat: Feature) => {
      const code: string = feat.properties?.N03_007 || "";
      const name: string = feat.properties?.N03_004 || "";
      const rec = dataMap.get(code);
      const fill = rec ? colorScale(rec.ratio) : noDataColor;
      const pathString = pathGenerator(feat) || "";
      const ratio = rec?.ratio ?? 1;

      return { path: pathString, fill, areaCode: code, areaName: name, ratio };
    });
}
