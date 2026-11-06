import { geoCentroid, geoMercator, geoPath } from "d3-geo";

import { fitGeoSvgMercator, topologyFeatures } from "@/components/charts/geo-topology";

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

type AreaProperties = Record<string, string | number | undefined>;

export interface MapShape {
  code: string;
  name: string;
  d: string;
}

export interface MapShapes {
  shapes: MapShape[];
  /** 沖縄を別の場所に置くときの区切りの線 */
  insetLine?: { x1: number; y1: number; x2: number; y2: number };
}

const OKINAWA = "47";
/** 全国の地図に置く沖縄の範囲 (沖縄本島周辺)。色は県や市町村で見るので本島が見えれば足りる */
const OKINAWA_MAIN_LONGITUDE = [126.5, 128.5];
/** 沖縄を置く場所。日本海側の海の上 */
const INSET = { x: 22, y: 76, width: 92, height: 92 };
const INSET_LINE = { x1: 192, y1: 76, x2: 56, y2: 212 };

const prefectureOf = (properties: AreaProperties) => {
  const raw = String(properties.N03_007 ?? "");
  return raw.length <= 2 ? raw.padStart(2, "0") : raw.padStart(5, "0").slice(0, 2);
};

const areaOf = (properties: AreaProperties, level: "prefecture" | "city") =>
  level === "prefecture"
    ? { code: `${prefectureOf(properties)}000`, name: String(properties.N03_001 ?? "") }
    : {
        code: String(properties.N03_007 ?? properties.cityCode ?? properties.areaCode ?? ""),
        name: String(properties.cityName ?? properties.N03_004 ?? properties.N03_003 ?? properties.name ?? ""),
      };

/**
 * 形データを SVG の形へ変える。全国の地図は沖縄を日本海側へ移し、遠い島で日本が小さくならないようにする。
 * 県や市の地図は渡された形をそのまま枠に収める。excludeCodes は描かない地域 (東京の島しょ部)。
 */
export function buildMapShapes(
  topology: Topology,
  { level, national, excludeCodes = [] }: { level: "prefecture" | "city"; national: boolean; excludeCodes?: readonly string[] },
): MapShapes {
  const excluded = new Set(excludeCodes);
  const features = topologyFeatures<AreaProperties>(topology).filter(
    (feature) => !excluded.has(areaOf(feature.properties, level).code),
  );
  const toShapes = (group: Feature<Geometry, AreaProperties>[], draw: (feature: Feature<Geometry, AreaProperties>) => string | null) =>
    group.map((feature) => ({ ...areaOf(feature.properties, level), d: draw(feature) ?? "" }));

  if (!national) return { shapes: toShapes(features, geoPath(fitGeoSvgMercator(features))) };

  const isOkinawa = (feature: Feature<Geometry, AreaProperties>) => prefectureOf(feature.properties) === OKINAWA;
  const mainland = features.filter((feature) => !isOkinawa(feature));
  const okinawa = features.filter((feature) => {
    if (!isOkinawa(feature)) return false;
    const [longitude] = geoCentroid(feature);
    return longitude >= OKINAWA_MAIN_LONGITUDE[0] && longitude <= OKINAWA_MAIN_LONGITUDE[1];
  });
  const insetPath = geoPath(
    geoMercator().fitExtent(
      [
        [INSET.x, INSET.y],
        [INSET.x + INSET.width, INSET.y + INSET.height],
      ],
      { type: "FeatureCollection", features: okinawa } as FeatureCollection,
    ),
  );
  return {
    shapes: [...toShapes(mainland, geoPath(fitGeoSvgMercator(mainland))), ...toShapes(okinawa, insetPath)],
    insetLine: INSET_LINE,
  };
}
