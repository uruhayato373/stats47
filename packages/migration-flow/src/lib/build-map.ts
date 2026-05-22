import { geoArea, geoMercator, geoPath } from "d3-geo";
import { scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import type { Feature, FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import { regionOf, type Region } from "./regions";
import type {
  MigrationFlowData,
  MunicipalityNet,
  PrefShape,
} from "../types";

/** 地図を描く矩形（フレーム内の内側領域。外側の余白に地方ラベルを置く） */
export interface MapRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BuildMapOptions {
  /** フレーム全体サイズ */
  width: number;
  height: number;
  /** 地図本体を描く矩形（既定はフレーム全体） */
  mapRect?: MapRect;
  noDataFill?: string;
  cityTopology?: Topology;
  municipalities?: MunicipalityNet[];
}

/** 焦点県の主要ポリゴンが地図枠に占める割合（自動ズーム） */
const FOCUS_FILL = 0.42;

/** (Multi)Polygon のうち最大面積のポリゴンだけの Feature を返す（島嶼を除外） */
function largestPolygon(feat: Feature): Feature {
  const g = feat.geometry;
  if (g.type !== "MultiPolygon") return feat;
  let best = g.coordinates[0];
  let bestArea = -1;
  for (const coords of g.coordinates) {
    const poly: Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: coords },
    };
    const a = geoArea(poly);
    if (a > bestArea) {
      bestArea = a;
      best = coords;
    }
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: best },
  };
}

export interface RegionFlow {
  region: Region;
  inflow: number;
  outflow: number;
  net: number;
  prefCount: number;
  /** 地図外の余白に置くラベル位置 [x, y] */
  anchor: [number, number];
}

export interface MigrationMap {
  shapes: PrefShape[];
  municipalityShapes: PrefShape[];
  focusOutlinePath: string;
  focusCentroid: [number, number] | null;
  regionFlows: RegionFlow[];
}


/**
 * prefecture.topojson を焦点県中心・固定スケールで mapRect 内に投影する。
 * 焦点県は cityTopology があれば市区町村粒度（市区町村別純移動で着色）、
 * 非焦点県はグレー一色。mapRect の外に出る県は地方単位に集約し、
 * 左右の余白にラベル（RegionFlow.anchor）を置く。
 */
export function buildMigrationMap(
  topology: Topology,
  data: MigrationFlowData,
  options: BuildMapOptions,
): MigrationMap {
  const {
    width,
    height,
    mapRect = { x0: 0, y0: 0, x1: width, y1: height },
    // 非焦点県（明るい地図上のニュートラルなグレー）
    noDataFill = "#C8D2DE",
    cityTopology,
    municipalities,
  } = options;

  const empty: MigrationMap = {
    shapes: [],
    municipalityShapes: [],
    focusOutlinePath: "",
    focusCentroid: null,
    regionFlows: [],
  };

  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return empty;
  const geojson = feature(
    topology,
    topology.objects[objectName] as GeometryCollection,
  ) as FeatureCollection;

  const focusFeat = geojson.features.find(
    (f) => f.properties?.N03_007 === data.focusCode,
  );
  if (!focusFeat) return empty;

  // 焦点県の主要ポリゴンを mapRect 中央の一定割合に収めて自動ズーム。
  // 島嶼は largestPolygon で除外し、本土が中央に来るようにする。
  const cx = (mapRect.x0 + mapRect.x1) / 2;
  const cy = (mapRect.y0 + mapRect.y1) / 2;
  const fitW = (mapRect.x1 - mapRect.x0) * FOCUS_FILL;
  const fitH = (mapRect.y1 - mapRect.y0) * FOCUS_FILL;
  const projection = geoMercator().fitExtent(
    [
      [cx - fitW / 2, cy - fitH / 2],
      [cx + fitW / 2, cy + fitH / 2],
    ],
    largestPolygon(focusFeat),
  );
  const pathGen = geoPath(projection);

  const inMapRect = (x: number, y: number) =>
    x >= mapRect.x0 && x <= mapRect.x1 && y >= mapRect.y0 && y <= mapRect.y1;

  // ── 非焦点県（グレー一色）──
  const focusCentroid = pathGen.centroid(focusFeat) as [number, number];
  const focusOutlinePath = pathGen(focusFeat) ?? "";
  const shapes: PrefShape[] = [];
  for (const feat of geojson.features) {
    const code: string = feat.properties?.N03_007 ?? "";
    if (code === data.focusCode) continue;
    const name: string = feat.properties?.N03_001 ?? "";
    const path = pathGen(feat as Feature) ?? "";
    const centroid = pathGen.centroid(feat as Feature) as [number, number];
    shapes.push({
      code,
      name,
      path,
      centroid,
      fill: noDataFill,
      near: inMapRect(centroid[0], centroid[1]),
      area: pathGen.area(feat as Feature),
    });
  }

  // ── 焦点県の市区町村コロプレス ──
  const municipalityShapes: PrefShape[] = [];
  if (cityTopology && municipalities && municipalities.length > 0) {
    const cityObj = Object.keys(cityTopology.objects)[0];
    if (cityObj) {
      const cityGeo = feature(
        cityTopology,
        cityTopology.objects[cityObj] as GeometryCollection,
      ) as FeatureCollection;
      // 転入超過「率」= 純移動 /(転入+転出) で着色する。
      // 絶対数だと神戸市のような大都市は僅差でも色が付くため、
      // 都市規模の偏りを除いた率で塗る。
      const muniRate = new Map(
        municipalities.map((m) => {
          const total = m.inflow + m.outflow;
          return [m.code, total > 0 ? m.net / total : 0];
        }),
      );
      // 88 パーセンタイルを彩度上限に（極端値のみ飽和、大半は階調内に収める）
      const absRates = [...muniRate.values()]
        .map((r) => Math.abs(r))
        .sort((a, b) => a - b);
      const rateDomain = Math.max(
        0.01,
        absRates[Math.floor(absRates.length * 0.88)] ?? 0.05,
      );
      // d3 標準の発散スキーム（赤=転出超過 / 白=均衡 / 青=転入超過）
      const muniColor = scaleDiverging(interpolateRdBu)
        .domain([-rateDomain, 0, rateDomain])
        .clamp(true);
      for (const feat of cityGeo.features) {
        const code: string = feat.properties?.N03_007 ?? "";
        const name: string = feat.properties?.N03_004 ?? "";
        municipalityShapes.push({
          code,
          name,
          path: pathGen(feat as Feature) ?? "",
          centroid: pathGen.centroid(feat as Feature) as [number, number],
          fill: muniRate.has(code)
            ? muniColor(muniRate.get(code) ?? 0)
            : noDataFill,
          near: true,
          area: pathGen.area(feat as Feature),
        });
      }
    }
  }

  // ── 地図外の県を地方集約 → 左右余白のラベルへ ──
  const nearCodes = new Set(shapes.filter((s) => s.near).map((s) => s.code));
  const centroidByCode = new Map(shapes.map((s) => [s.code, s.centroid]));
  const fc = focusCentroid;
  const agg = new Map<
    Region,
    { inflow: number; outflow: number; sx: number; sy: number; n: number }
  >();
  for (const p of data.partners) {
    if (nearCodes.has(p.code)) continue;
    const region = regionOf(p.code);
    const c = centroidByCode.get(p.code) ?? fc;
    const a = agg.get(region) ?? { inflow: 0, outflow: 0, sx: 0, sy: 0, n: 0 };
    a.inflow += p.inflow;
    a.outflow += p.outflow;
    a.sx += c[0];
    a.sy += c[1];
    a.n += 1;
    agg.set(region, a);
  }

  // 左右余白の中央 x
  const leftX = mapRect.x0 / 2;
  const rightX = (mapRect.x1 + width) / 2;
  const labelMinY = mapRect.y0 + 46;
  const labelMaxY = mapRect.y1 - 46;

  const regionFlows: RegionFlow[] = [];
  for (const [region, a] of agg) {
    const avg: [number, number] = [a.sx / a.n, a.sy / a.n];
    const dx = avg[0] - fc[0];
    const dy = avg[1] - fc[1];
    const toRight = dx >= 0;
    const marginX = toRight ? rightX : leftX;
    // 焦点から地方方向のレイが marginX に達する y
    let y = fc[1];
    if (Math.abs(dx) > 1e-3) y = fc[1] + (dy / dx) * (marginX - fc[0]);
    y = Math.min(labelMaxY, Math.max(labelMinY, y));
    regionFlows.push({
      region,
      inflow: a.inflow,
      outflow: a.outflow,
      net: a.inflow - a.outflow,
      prefCount: a.n,
      anchor: [marginX, y],
    });
  }
  spreadRegionLabels(regionFlows, width / 2, labelMinY, labelMaxY);

  return {
    shapes,
    municipalityShapes,
    focusOutlinePath,
    focusCentroid,
    regionFlows,
  };
}

/** 左右それぞれの余白で、ラベルを縦に最小間隔で並べ直す */
function spreadRegionLabels(
  flows: RegionFlow[],
  frameMidX: number,
  minY: number,
  maxY: number,
): void {
  const GAP = 96;
  for (const side of ["L", "R"] as const) {
    const group = flows.filter((f) =>
      side === "L" ? f.anchor[0] < frameMidX : f.anchor[0] >= frameMidX,
    );
    if (group.length < 2) continue;
    group.sort((a, b) => a.anchor[1] - b.anchor[1]);
    for (let i = 1; i < group.length; i++) {
      if (group[i].anchor[1] - group[i - 1].anchor[1] < GAP) {
        group[i].anchor[1] = group[i - 1].anchor[1] + GAP;
      }
    }
    const last = group[group.length - 1].anchor[1];
    if (last > maxY) {
      const shift = last - maxY;
      for (const f of group) f.anchor[1] -= shift;
    }
    if (group[0].anchor[1] < minY) {
      const shift = minY - group[0].anchor[1];
      for (const f of group) f.anchor[1] += shift;
    }
  }
}
