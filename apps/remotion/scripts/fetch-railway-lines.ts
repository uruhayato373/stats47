/**
 * 国土数値情報「鉄道」(N02) の路線ライン (RailroadSection) を
 * 都道府県別に切り出し、public/station-passengers/lines-{NN}.json
 * (GeoJSON FeatureCollection of LineString) へ書き出す。
 *
 * 元データ: KSJ パイプラインが生成した全国 N02 路線 TopoJSON。
 * 駅バブルマップ (StationPassengersReel) が路線図レイヤーとして読み込む。
 *
 * 実行:
 *   tsx scripts/fetch-railway-lines.ts 22        # 静岡県
 *   tsx scripts/fetch-railway-lines.ts 13 22 26  # 複数県
 *   tsx scripts/fetch-railway-lines.ts all       # 全 47 県
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Feature, FeatureCollection, LineString, Position } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(REMOTION_ROOT, "../..");
const OUT_DIR = resolve(REMOTION_ROOT, "public/station-passengers");

/** KSJ パイプラインが出力した全国 N02 路線 TopoJSON (中身は全国共通) */
const N02_TOPOJSON = resolve(
  REPO_ROOT,
  ".local/r2/gis/mlit-ksj/N02/22/N02-22_RailroadSection.topojson",
);
const PREF_TOPOJSON = resolve(REMOTION_ROOT, "public/prefecture.topojson");

/** 県境 bbox に付けるマージン (度) */
const BBOX_MARGIN = 0.04;

type BBox = [number, number, number, number]; // [west, south, east, north]

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** GeoJSON ジオメトリの全頂点を走査して bbox を求める */
function featureBBox(feat: Feature): BBox {
  let w = Infinity,
    s = Infinity,
    e = -Infinity,
    n = -Infinity;
  const visit = (pos: Position) => {
    if (pos[0] < w) w = pos[0];
    if (pos[0] > e) e = pos[0];
    if (pos[1] < s) s = pos[1];
    if (pos[1] > n) n = pos[1];
  };
  const walk = (coords: unknown): void => {
    if (
      Array.isArray(coords) &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      visit(coords as Position);
      return;
    }
    if (Array.isArray(coords)) for (const c of coords) walk(c);
  };
  walk((feat.geometry as { coordinates?: unknown }).coordinates);
  return [w, s, e, n];
}

function inBBox(pos: Position, b: BBox): boolean {
  return pos[0] >= b[0] && pos[0] <= b[2] && pos[1] >= b[1] && pos[1] <= b[3];
}

function main() {
  const args = process.argv.slice(2);

  const prefTopo = readJson<Topology>(PREF_TOPOJSON);
  const prefObj = Object.keys(prefTopo.objects)[0];
  const prefGeo = feature(
    prefTopo,
    prefTopo.objects[prefObj] as GeometryCollection,
  ) as FeatureCollection;

  const codes =
    args.length === 0
      ? ["22"]
      : args[0] === "all"
        ? prefGeo.features
            .map((f) => String(f.properties?.N03_007 ?? ""))
            .filter((c) => /^\d{2}$/.test(c))
            .sort()
            .filter((c, i, a) => a.indexOf(c) === i)
        : args.map((a) => a.padStart(2, "0").slice(0, 2));

  console.log("[load] N02 路線 TopoJSON ...");
  const n02 = readJson<Topology>(N02_TOPOJSON);
  const n02Obj = Object.keys(n02.objects)[0];
  const n02Geo = feature(
    n02,
    n02.objects[n02Obj] as GeometryCollection,
  ) as FeatureCollection;
  console.log(`[load] ${n02Geo.features.length} 路線セグメント`);

  mkdirSync(OUT_DIR, { recursive: true });

  for (const code of codes) {
    const prefFeat = prefGeo.features.find(
      (f) => String(f.properties?.N03_007 ?? "") === code,
    );
    if (!prefFeat) {
      console.warn(`[skip] 県コード ${code} が prefecture.topojson に無い`);
      continue;
    }
    const b = featureBBox(prefFeat);
    const box: BBox = [
      b[0] - BBOX_MARGIN,
      b[1] - BBOX_MARGIN,
      b[2] + BBOX_MARGIN,
      b[3] + BBOX_MARGIN,
    ];

    /** 1 頂点でも県 bbox 内にあれば採用 (県境をまたぐ路線も拾う) */
    const lines: Feature[] = n02Geo.features.filter((f) => {
      if (f.geometry?.type !== "LineString") return false;
      const coords = (f.geometry as LineString).coordinates;
      return coords.some((p) => inBBox(p, box));
    });

    const fc: FeatureCollection = {
      type: "FeatureCollection",
      features: lines.map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: {
          lineName: f.properties?.lineName ?? "",
          operatorName: f.properties?.operatorName ?? "",
          railwayType: f.properties?.railwayType ?? "",
        },
      })),
    };

    const outPath = resolve(OUT_DIR, `lines-${code}.json`);
    writeFileSync(outPath, JSON.stringify(fc));
    console.log(`[write] ${code}: ${lines.length} セグメント → ${outPath}`);
  }
}

main();
