/**
 * 都道府県ジオメトリのローダ。e-Stat「令和 2 年国勢調査 町丁・字等別境界データ」から作った都道府県境界
 * (`.local/data-packs/_boundary/prefecture-r2census-2020.geojson`・`prefecture-boundary.ts`) を読み、
 * 県コードで結合できる外周リング (Office custGeom / SVG path 用) を返す。
 * 国土数値情報 (N03 系) の `apps/remotion/public/prefecture.topojson` は売る地図には使わない (2026-11-22 オーナー決定)。
 *
 * 座標は width×height の画素系 (Mercator・y 反転)。境界は生成スクリプトが離島を 1 km² 以上に絞っている。
 * 小笠原など遠隔離島は clip で落とす (JAPAN_CLIP)。沖縄インセットは Phase 3+ のレイアウト側で扱う。
 */
import { existsSync, readFileSync } from "node:fs";
import type { Geometry } from "geojson";
import { toCode5 } from "../data/prefectures";
import { PREFECTURE_BOUNDARY_PATH, type PrefectureBoundary } from "./prefecture-boundary";

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

/** 境界ファイルが無いときの案内 (別の境界へ黙って切り替えない)。 */
export function missingBoundaryMessage(path: string): string {
  return (
    `都道府県の境界が無い: ${path}\n` +
    "  e-Stat の境界から作る: npx tsx packages/product-factory/scripts/build-prefecture-boundary.mts " +
    "(都道府県ごとの shapefile を e-Stat からダウンロードする。--source-dir で取得済みの場所を渡せる)"
  );
}

/** 地図の描画に使う頂点の間引き幅 (targetWidth に対する比。1000 画素幅なら 0.8 画素)。 */
export const SIMPLIFY_TOLERANCE_RATIO = 0.0008;

export interface LoadGeometryOptions {
  /** ファイルの代わりに使う境界 (テスト用)。 */
  readonly boundary?: PrefectureBoundary;
  /** 頂点の間引き幅 (画素)。0 で間引かない。既定は targetWidth × SIMPLIFY_TOLERANCE_RATIO。 */
  readonly tolerance?: number;
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Douglas-Peucker (反復版)。点列の両端は残す。 */
function simplifyPolyline(points: readonly Point[], tolerance: number): Point[] {
  if (points.length <= 2) return [...points];
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    let worst = -1;
    let worstDist = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const d = perpendicularDistance(points[i], points[from], points[to]);
      if (d > worstDist) {
        worst = i;
        worstDist = d;
      }
    }
    if (worst > 0) {
      keep[worst] = true;
      stack.push([from, worst], [worst, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * 閉じた輪を間引く。始点=終点のまま両端が同じ点になる退化を避けるため、始点から最も遠い点で輪を 2 つに割って間引く。
 * 3 点 (+閉じる点) に満たなくなる輪は null。
 */
export function simplifyRing(ring: readonly Point[], tolerance: number): Point[] | null {
  const open = ring.length > 1 && ring[0].x === ring[ring.length - 1].x && ring[0].y === ring[ring.length - 1].y ? ring.slice(0, -1) : [...ring];
  if (open.length < 3) return null;
  let far = 1;
  let farDist = -1;
  for (let i = 1; i < open.length; i += 1) {
    const d = Math.hypot(open[i].x - open[0].x, open[i].y - open[0].y);
    if (d > farDist) {
      far = i;
      farDist = d;
    }
  }
  const first = simplifyPolyline(open.slice(0, far + 1), tolerance);
  const second = simplifyPolyline([...open.slice(far), open[0]], tolerance);
  const merged = [...first, ...second.slice(1, -1)];
  if (merged.length < 3) return null;
  return [...merged, merged[0]];
}

/** 幅・高さのどちらも minExtent 未満の輪 (描いても点にしか見えない離島) か。 */
function isSpeck(ring: readonly Point[], minExtent: number): boolean {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of ring) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return maxX - minX < minExtent && maxY - minY < minExtent;
}

/**
 * 地図の描画用に頂点を間引き、点にしか見えない離島の輪を落とす。県の形は必ず 1 つは残す (最大の輪)。
 * 面積・人口の検査は境界ファイルの段階で済んでおり、ここは見た目の解像度だけを決める。
 */
export function simplifyGeometry(geo: PrefectureGeometry, tolerance: number): PrefectureGeometry {
  if (tolerance <= 0) return geo;
  const shapes = geo.shapes.map((s) => {
    const simplified = s.rings
      .map((ring) => ({ ring, out: simplifyRing(ring, tolerance) }))
      .filter((r): r is { ring: readonly Point[]; out: Point[] } => r.out !== null && !isSpeck(r.out, tolerance * 2));
    if (simplified.length > 0) return { ...s, rings: simplified.map((r) => r.out) };
    // どの輪も点に潰れる県は、元の最大の輪をそのまま残す (県が地図から消えない)
    const biggest = [...s.rings].sort((a, b) => b.length - a.length)[0];
    return { ...s, rings: biggest ? [biggest] : [] };
  });
  return { ...geo, shapes };
}

/**
 * 都道府県境界を読み、画素系に投影した 47 県 shape を返す。
 * clip を渡すと、枠外の外れ島リングを落とす (各県の本体リングは残る)。
 * 頂点は描画用に間引く (既定 0.8 画素)。
 */
export function loadPrefectureGeometry(targetWidth = 1000, clip?: ClipBox, opts: LoadGeometryOptions = {}): PrefectureGeometry {
  let collection: PrefectureBoundary;
  if (opts.boundary) collection = opts.boundary;
  else {
    if (!existsSync(PREFECTURE_BOUNDARY_PATH)) throw new Error(missingBoundaryMessage(PREFECTURE_BOUNDARY_PATH));
    collection = JSON.parse(readFileSync(PREFECTURE_BOUNDARY_PATH, "utf8")) as PrefectureBoundary;
  }

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
    const props = feat.properties;
    if (!props?.code) continue;
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
    rawShapes.push({ code5: toCode5(props.code), name: props.name ?? "", rings });
  }

  const spanX = maxX - minX || 1;
  const scale = targetWidth / spanX;
  const height = (maxY - minY) * scale;

  const shapes: PrefectureShape[] = rawShapes.map((s) => ({
    code5: s.code5,
    name: s.name,
    rings: s.rings.map((ring) => ring.map(([x, y]) => ({ x: (x - minX) * scale, y: (maxY - y) * scale }))),
  }));

  return simplifyGeometry({ width: targetWidth, height, shapes }, opts.tolerance ?? targetWidth * SIMPLIFY_TOLERANCE_RATIO);
}
