/**
 * テスト用の都道府県境界 (47 個の格子の四角形)。本物の境界 (e-Stat 由来・`.local/data-packs/_boundary/`) は git 管理外で
 * CI には無いので、生成物の構造 (図形の数・県コードの結合・ファイルの有無) を調べるテストはこれを渡して動かす。
 * 形そのものを調べるテストは本物の境界で `describe.skipIf(!prefectureBoundaryExists())` にする。
 */
import type { PrefectureBoundary } from "../../src/maps/prefecture-boundary";
import { PREFECTURES } from "../../src/data/prefectures";
import { loadPrefectureGeometry, type PrefectureGeometry } from "../../src/maps/prefecture-geometry";

const COLUMNS = 8;
const CELL_DEG = 2;
const ORIGIN = { lon: 124, lat: 26 } as const;

export function syntheticBoundary(): PrefectureBoundary {
  return {
    type: "FeatureCollection",
    features: PREFECTURES.map((p, i) => {
      const lon = ORIGIN.lon + (i % COLUMNS) * CELL_DEG;
      const lat = ORIGIN.lat + Math.floor(i / COLUMNS) * CELL_DEG;
      const ring = [
        [lon, lat],
        [lon + CELL_DEG - 0.2, lat],
        [lon + CELL_DEG - 0.2, lat + CELL_DEG - 0.2],
        [lon, lat + CELL_DEG - 0.2],
        [lon, lat],
      ];
      return { type: "Feature", properties: { code: p.code2, name: p.name }, geometry: { type: "Polygon", coordinates: [ring] } };
    }),
  };
}

export function syntheticGeometry(): PrefectureGeometry {
  return loadPrefectureGeometry(1000, undefined, { boundary: syntheticBoundary(), tolerance: 0 });
}
