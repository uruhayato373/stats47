import { geoArea, geoCentroid, geoMercator, geoPath } from "d3-geo";
import { scaleDiverging, scaleSequential } from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import type { Feature, FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

// ---------------------------------------------------------
// 型定義
// ---------------------------------------------------------

export interface ChoroplethPathInfo {
  path: string;
  fill: string;
  prefCode: string;
  prefName: string;
}

export interface ChoroplethDataItem {
  areaCode: string;
  value: number;
}

export interface ChoroplethOptions {
  width?: number;
  height?: number;
  /** D3 interpolator 名 (default: "interpolateBlues") */
  colorScheme?: string;
  /** カラースキームの種類 (default: "sequential") */
  colorSchemeType?: "sequential" | "diverging";
  /** diverging スケールの中間値 */
  divergingMidpointValue?: number;
  /** データなし時の色 (default: "#e0e0e0") */
  noDataColor?: string;
  /** 境界線の色 */
  strokeColor?: string;
  /** 境界線の太さ */
  strokeWidth?: number;
  /** padding (default: 10) */
  padding?: number;
  /** 垂直方向のオフセット (default: 0) */
  offsetY?: number;
  /** 水平方向のオフセット (default: 0) */
  offsetX?: number;
}

// ---------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------

/**
 * 都道府県コードを5桁に正規化
 * "01" → "01000", "13" → "13000", "13000" → "13000"
 */
function normalizePrefCode(code: string | number | undefined): string {
  if (!code) return "00000";
  const s = String(code);
  if (s.length === 5) return s;
  if (s.length <= 2) return `${s.padStart(2, "0")}000`;
  return s;
}

/**
 * D3 の interpolator 関数名から関数を取得
 */
function getInterpolator(name: string): (t: number) => string {
  const fn = (chromatic as Record<string, unknown>)[name];
  if (typeof fn === "function") return fn as (t: number) => string;
  return chromatic.interpolateBlues;
}

// ---------------------------------------------------------
// メイン関数
// ---------------------------------------------------------

/**
 * TopoJSON + データからコロプレス地図の SVG パス情報を計算
 *
 * @param topology - TopoJSON Topology オブジェクト
 * @param data - 都道府県ごとの値データ (areaCode は "13000" 形式 or "13" 形式)
 * @param options - 描画オプション
 */
// ---------------------------------------------------------
// 単一都道府県シルエット
// ---------------------------------------------------------

export interface PrefectureSilhouette {
  path: string;
  viewBox: { x: number; y: number; width: number; height: number };
}

/**
 * MultiPolygon から離島・小ポリゴンを除去し、本土部分のみを残す。
 *
 * 1. 面積が最大ポリゴンの areaRatio 未満のものを除去
 * 2. 最大ポリゴンの重心から maxDegrees 以上離れたものを除去
 */
function filterMainlandPolygons(
  coordinates: number[][][][],
  areaRatio = 0.01,
  maxDegrees = 0.9
): number[][][][] {
  if (coordinates.length <= 1) return coordinates;

  const withMeta = coordinates.map((coords) => {
    const poly = { type: "Polygon" as const, coordinates: coords };
    return { coords, area: geoArea(poly), centroid: geoCentroid(poly) };
  });
  withMeta.sort((a, b) => b.area - a.area);

  const largest = withMeta[0];
  const threshold = largest.area * areaRatio;
  const [cx, cy] = largest.centroid;

  return withMeta
    .filter((p) => {
      if (p.area < threshold) return false;
      const dx = p.centroid[0] - cx;
      const dy = p.centroid[1] - cy;
      return Math.sqrt(dx * dx + dy * dy) <= maxDegrees;
    })
    .map((p) => p.coords);
}

/**
 * 単一都道府県の GeoJSON Feature に fitExtent をかけ、
 * その県だけに最適化された SVG path を返す。
 * 離島・小ポリゴンは自動除去し、本土部分に最適フィットする。
 */
export function computePrefectureSilhouette(
  topology: Topology,
  areaCode: string,
  options?: { width?: number; height?: number; padding?: number }
): PrefectureSilhouette | null {
  const { width = 200, height = 200, padding = 10 } = options ?? {};

  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return null;

  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection
  ) as FeatureCollection;

  const normalizedCode = normalizePrefCode(areaCode);
  const target = geojson.features.find((feat: Feature) => {
    const props = feat.properties || {};
    const rawCode = props.N03_007 || props.prefCode || props.code;
    return normalizePrefCode(rawCode) === normalizedCode;
  });

  if (!target) return null;

  // MultiPolygon の離島除去
  const filtered: Feature = target.geometry.type === "MultiPolygon"
    ? {
        ...target,
        geometry: {
          type: "MultiPolygon" as const,
          coordinates: filterMainlandPolygons(
            target.geometry.coordinates as number[][][][]
          ),
        },
      }
    : target;

  const singleCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: [filtered],
  };

  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    singleCollection
  );

  const pathGenerator = geoPath().projection(projection);
  const pathString = pathGenerator(filtered);

  if (!pathString) return null;

  return {
    path: pathString,
    viewBox: { x: 0, y: 0, width, height },
  };
}

// ---------------------------------------------------------
// コロプレスマップ
// ---------------------------------------------------------

export function computeChoroplethPaths(
  topology: Topology,
  data: ChoroplethDataItem[],
  options: ChoroplethOptions
): ChoroplethPathInfo[] {
  const {
    width = 1000,
    height = 1000,
    colorScheme = "interpolateBlues",
    colorSchemeType = "sequential",
    divergingMidpointValue,
    noDataColor = "#e0e0e0",
    padding = 10,
    offsetY = 0,
    offsetX = 0,
  } = options;

  // TopoJSON → GeoJSON 変換
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return [];

  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection
  ) as FeatureCollection;

  // データマップ構築 (5桁正規化コード → 値)
  const valueMap = new Map<string, number>();
  for (const item of data) {
    valueMap.set(normalizePrefCode(item.areaCode), item.value);
  }

  // カラースケール
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const interpolator = getInterpolator(colorScheme);
  const colorScale = colorSchemeType === "diverging"
    ? scaleDiverging(interpolator).domain([minVal, divergingMidpointValue ?? (minVal + maxVal) / 2, maxVal])
    : scaleSequential(interpolator).domain([minVal, maxVal]);

  // 投影
  const projection = geoMercator()
    .fitExtent(
      [
        [padding + offsetX, padding + offsetY],
        [width - padding + offsetX, height - padding + offsetY],
      ],
      geojson
    );

  const pathGenerator = geoPath().projection(projection);

  // パス生成
  return geojson.features.map((feat: Feature) => {
    const props = feat.properties || {};
    const rawCode = props.N03_007 || props.prefCode || props.code;
    const prefCode = normalizePrefCode(rawCode);
    const prefName = props.N03_001 || props.prefName || props.name || "";
    const value = valueMap.get(prefCode);
    const fill = value !== undefined ? colorScale(value) : noDataColor;
    const pathString = pathGenerator(feat) || "";

    return { path: pathString, fill, prefCode, prefName };
  });
}
