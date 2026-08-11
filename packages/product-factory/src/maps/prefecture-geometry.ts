/**
 * 都道府県ジオメトリのローダ。apps/remotion/public/prefecture.topojson を復号し、
 * 県コードで結合できる外周リング (Office custGeom / SVG path 用) を返す。
 *
 * Phase 0 判定の採用方式: topojson → 投影 → 県別 shape。座標は width×height の画素系 (Mercator・y 反転)。
 * 既知の限界: 小笠原・伊豆諸島 (東京) 等の遠隔離島も含むため bbox が縦に伸びる。
 * 沖縄インセット・離島トリムは Phase 3+ のレイアウト側で扱う (buzz-map と同方針)。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Geometry } from "geojson";
import { toCode5 } from "../data/prefectures";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface PrefectureShape {
  readonly code5: string;
  readonly name: string;
  /** 外周リング群 (離島は複数)。各リングは閉じた点列。 */
  readonly rings: readonly (readonly Point[])[];
}

export interface PrefectureGeometry {
  readonly width: number;
  readonly height: number;
  readonly shapes: readonly PrefectureShape[];
}

/** 経緯度クリップ枠 (遠隔離島を落として地図の間延びを防ぐ)。 */
export interface ClipBox {
  readonly lonMin: number;
  readonly lonMax: number;
  readonly latMin: number;
  readonly latMax: number;
}

/** 本土 + 沖縄。南鳥島 (154°E)・沖ノ鳥島 (20°N) 等の極端な外れ島を除外する。 */
export const JAPAN_CLIP: ClipBox = { lonMin: 122, lonMax: 146, latMin: 23, latMax: 46 };

type LonLat = readonly [number, number];

const here = dirname(fileURLToPath(import.meta.url)); // packages/product-factory/src/maps
const TOPO_PATH = resolve(here, "../../../..", "apps/remotion/public/prefecture.topojson");

/**
 * Mercator の x/y は **同じ単位** (ラジアン) でなければ縦横比が壊れる。
 *
 * 2026-08-12 まで x に経度を「度」のまま使い、y だけ ln(tan(...)) のラジアン系だったため、
 * 日本が横に約 57 倍 (= 180/π) 引き伸ばされ、**商品の地図がアスペクト比 0.079 の
 * 平たい帯**になっていた (正しくは約 1.18)。既存テストは「点が枠内にあるか」しか見ておらず
 * 素通りしていた。x を必ずラジアンに直す。
 */
function mercatorX(lonDeg: number): number {
  return (lonDeg * Math.PI) / 180;
}

function mercatorY(latDeg: number): number {
  const lat = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + lat / 2));
}

function exteriorRings(g: Geometry | null): LonLat[][] {
  if (!g) return [];
  if (g.type === "Polygon") {
    const outer = g.coordinates[0];
    return outer ? [outer.map((p) => [p[0], p[1]] as LonLat)] : [];
  }
  if (g.type === "MultiPolygon") {
    return g.coordinates.map((poly) => (poly[0] ?? []).map((p) => [p[0], p[1]] as LonLat));
  }
  return [];
}

function ringInClip(ring: LonLat[], clip: ClipBox): boolean {
  return ring.some(
    ([lon, lat]) => lon >= clip.lonMin && lon <= clip.lonMax && lat >= clip.latMin && lat <= clip.latMax,
  );
}

/**
 * topojson を復号し、画素系に投影した 47 県 shape を返す。
 * clip を渡すと、枠外の外れ島リングを落とす (各県の本体リングは残る)。
 */
export function loadPrefectureGeometry(targetWidth = 1000, clip?: ClipBox): PrefectureGeometry {
  const raw: unknown = JSON.parse(readFileSync(TOPO_PATH, "utf8"));
  const topo = raw as Topology;
  const collection = feature(topo, topo.objects.pref as GeometryCollection);

  interface RawShape {
    code5: string;
    name: string;
    rings: LonLat[][]; // [lon, mercatorY]
  }
  const rawShapes: RawShape[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const feat of collection.features) {
    const props = feat.properties as { N03_007?: string; N03_001?: string } | null;
    if (!props?.N03_007) continue;
    const lonLatRings = exteriorRings(feat.geometry);
    const kept = clip ? lonLatRings.filter((ring) => ringInClip(ring, clip)) : lonLatRings;
    if (kept.length === 0) continue;
    const rings = kept.map((ring) => ring.map(([lon, lat]) => [mercatorX(lon), mercatorY(lat)] as LonLat));
    for (const ring of rings) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    rawShapes.push({ code5: toCode5(props.N03_007), name: props.N03_001 ?? "", rings });
  }

  const spanX = maxX - minX || 1;
  const scale = targetWidth / spanX;
  const height = (maxY - minY) * scale;

  const shapes: PrefectureShape[] = rawShapes.map((s) => ({
    code5: s.code5,
    name: s.name,
    rings: s.rings.map((ring) => ring.map(([x, y]) => ({ x: (x - minX) * scale, y: (maxY - y) * scale }))),
  }));

  return { width: targetWidth, height, shapes };
}
