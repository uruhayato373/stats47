import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";

import type { RankingValue } from "@stats47/ranking";
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

/**
 * ランキング値を都道府県の境界に結合し、地図アプリにそのまま読み込める KML / GeoJSON を作る。
 * Google マイマップ・Google Earth・QGIS で開けることを想定する (2026-10-17 新設。
 * note の「Google マップで KML を使う方法」が検索で読まれていることへの受け皿)。
 *
 * 値は最新年だけを使う (地図は 1 時点の塗り分けなので)。境界は国土数値情報の行政区域。
 */

export const MAP_BOUNDARY_ATTRIBUTION =
  "境界: 国土交通省「国土数値情報（行政区域データ）」を加工して作成";

/** 5 段階の塗り分け色 (薄い → 濃い)。KML は aabbggrr 形式なので別に持つ */
const CLASS_COLORS_HEX = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"] as const;
const NO_DATA_HEX = "#d9d9d9";
const FILL_OPACITY_KML = "b3"; // 約 70%
const COORDINATE_DIGITS = 5;

interface MapDownloadMeta {
  readonly rankingKey: string;
  /** ランキングの表示名。マイマップのレイヤ名になるので、無いときだけ rankingKey を使う */
  readonly title?: string | null;
  readonly pageUrl: string;
}

export interface MapDownloadInput {
  readonly features: readonly Feature[];
  readonly values: readonly RankingValue[];
  readonly meta: MapDownloadMeta;
}

function prefCodeOf(value: unknown): string | null {
  return String(value ?? "").match(/\d{2}/)?.[0] ?? null;
}

/** 系列のうち最新年の値だけを県コード (2 桁) で引けるようにする */
function latestYearValues(values: readonly RankingValue[]): {
  yearName: string | null;
  byCode: Map<string, RankingValue>;
} {
  const latestYear = values.reduce<string | null>(
    (max, v) => (max === null || v.yearCode > max ? v.yearCode : max),
    null
  );
  const byCode = new Map<string, RankingValue>();
  for (const v of values) {
    if (v.yearCode !== latestYear) continue;
    const code = prefCodeOf(v.areaCode);
    if (code) byCode.set(code, v);
  }
  const sample = byCode.values().next().value as RankingValue | undefined;
  return { yearName: sample?.yearName ?? null, byCode };
}

/** 値を 5 分位で 0〜4 の階級に分ける。値が無ければ null */
function classifier(values: readonly number[]): (v: number | null | undefined) => number | null {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return () => null;
  const breaks = [1, 2, 3, 4].map((q) => sorted[Math.floor((sorted.length * q) / 5)] ?? sorted[sorted.length - 1]);
  return (v) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return null;
    const idx = breaks.findIndex((b) => v < b);
    return idx === -1 ? 4 : idx;
  };
}

function round(n: number): number {
  return Number(n.toFixed(COORDINATE_DIGITS));
}

function polygonsOf(geometry: Feature["geometry"]): Position[][][] {
  if (geometry?.type === "Polygon") return [(geometry as Polygon).coordinates];
  if (geometry?.type === "MultiPolygon") return (geometry as MultiPolygon).coordinates;
  return [];
}

/** 丸めで点が 3 つ未満に潰れた環は面にならない */
function isAreaRing(ring: Position[]): boolean {
  return new Set(ring.map(([x, y]) => `${x},${y}`)).size >= 3;
}

/**
 * 座標を丸め、潰れた小島 (外周) と穴を落とす。
 * Google マイマップは潰れた外周を 1 つでも含む県を、塗りのない線として読み込む
 * (2026-10-28 実測: 総人口の KML で東京都など 13 府県が枠線だけになり、潰れた外周 25 個を落とすと 47 県とも塗られた)。
 */
function roundPolygons(geometry: Feature["geometry"]): Position[][][] {
  return polygonsOf(geometry)
    .map((poly) => poly.map((ring) => ring.map(([x, y]) => [round(x), round(y)])))
    .filter(([outer]) => outer !== undefined && isAreaRing(outer))
    .map(([outer, ...holes]) => [outer, ...holes.filter(isAreaRing)]);
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c);
}

function formatValue(v: RankingValue | undefined, precision: number): string {
  if (!v || v.value === null || v.value === undefined) return "データなし";
  return `${formatValueWithPrecision(v.value, precision)}${v.unit ? ` ${v.unit}` : ""}`;
}

function describe(v: RankingValue | undefined, yearName: string | null, meta: MapDownloadMeta, precision: number): string {
  const lines = [
    `値: ${formatValue(v, precision)}`,
    v?.rank ? `順位: ${v.rank}位 / 47` : null,
    yearName ? `時点: ${yearName}` : null,
    `統計の出典と定義: ${meta.pageUrl}`,
    MAP_BOUNDARY_ATTRIBUTION,
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildMapGeoJson({ features, values, meta }: MapDownloadInput): FeatureCollection {
  const { yearName, byCode } = latestYearValues(values);
  const classify = classifier([...byCode.values()].flatMap((v) => (v.value ?? null) === null ? [] : [v.value as number]));
  return {
    type: "FeatureCollection",
    features: features.map((f) => {
      const code = prefCodeOf(f.properties?.N03_007);
      const v = code ? byCode.get(code) : undefined;
      const cls = classify(v?.value);
      return {
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: roundPolygons(f.geometry),
        },
        properties: {
          prefCode: code,
          prefName: String(f.properties?.N03_001 ?? v?.areaName ?? ""),
          value: v?.value ?? null,
          unit: v?.unit ?? null,
          rank: v?.rank ?? null,
          year: yearName,
          fill: cls === null ? NO_DATA_HEX : CLASS_COLORS_HEX[cls],
          rankingKey: meta.rankingKey,
          title: meta.title ?? null,
          source: meta.pageUrl,
          boundarySource: MAP_BOUNDARY_ATTRIBUTION,
        },
      };
    }),
  };
}

/** #rrggbb → KML の aabbggrr */
function kmlColor(hex: string): string {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
  return `${FILL_OPACITY_KML}${b}${g}${r}`;
}

export function buildMapKml(input: MapDownloadInput): string {
  const { yearName, byCode } = latestYearValues(input.values);
  // 桁数は同じ地図に並ぶ 47 県の値から 1 度だけ決める
  const precision = resolveValuePrecision([...byCode.values()].flatMap((v) => (v.value === null || v.value === undefined ? [] : [v.value])));
  const collection = buildMapGeoJson(input);
  const styleIds = [...CLASS_COLORS_HEX, NO_DATA_HEX];
  const styles = styleIds
    .map(
      (hex, i) =>
        `<Style id="c${i}"><LineStyle><color>ff666666</color><width>1</width></LineStyle><PolyStyle><color>${kmlColor(hex)}</color></PolyStyle></Style>`
    )
    .join("");
  const placemarks = collection.features
    .map((f) => {
      const p = f.properties as { prefCode: string | null; prefName: string; fill: string };
      const v = p.prefCode ? byCode.get(p.prefCode) : undefined;
      const styleIndex = styleIds.indexOf(p.fill);
      const polygons = (f.geometry as MultiPolygon).coordinates
        .map((poly) => {
          const [outer, ...holes] = poly.map((ring) => ring.map(([x, y]) => `${x},${y}`).join(" "));
          const inner = holes.map((h) => `<innerBoundaryIs><LinearRing><coordinates>${h}</coordinates></LinearRing></innerBoundaryIs>`).join("");
          return `<Polygon><outerBoundaryIs><LinearRing><coordinates>${outer}</coordinates></LinearRing></outerBoundaryIs>${inner}</Polygon>`;
        })
        .join("");
      return `<Placemark><name>${escapeXml(p.prefName)}</name><description>${escapeXml(describe(v, yearName, input.meta, precision))}</description><styleUrl>#c${styleIndex}</styleUrl><MultiGeometry>${polygons}</MultiGeometry></Placemark>`;
    })
    .join("");
  const docName = `${input.meta.title || input.meta.rankingKey}${yearName ? `（${yearName}）` : ""}`;
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${escapeXml(docName)}</name><description>${escapeXml(`stats47 のランキングを都道府県の地図にしたものです。\n${input.meta.pageUrl}\n${MAP_BOUNDARY_ATTRIBUTION}`)}</description>${styles}${placemarks}</Document></kml>`;
}
