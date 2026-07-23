import { REGIONS, type Prefecture } from "@stats47/area";
// 純データ（47 件のタイル座標）だけを直接 import する。d3/constants バレル経由だと
// d3-scale-chromatic 等が /areas バンドルへ混入するため、tile-grid-layout ファイルを名指しする。
import { TILE_GRID_LAYOUT } from "@stats47/visualization/d3/constants/tile-grid-layout";

/**
 * `/areas` 選択 UI（検索 / 一覧 / 地図）が共有する派生データを、単一の SSOT
 * （`fetchPrefectures()` / `REGIONS` / `TILE_GRID_LAYOUT`）から組み立てる純関数。
 *
 * 県名・コード・地方構成・タイル座標を新しい配列へ複製せず、既存 SSOT を join するだけ。
 * 返り値はすべて serializable（関数を含まない）なので Server → Client 境界を跨げる。
 */

export interface AreaRegionGroup {
  regionCode: string;
  regionName: string;
  prefectures: Prefecture[];
}

export interface AreaTile {
  /** 5 桁都道府県コード（URL 用） */
  prefCode: string;
  /** 正式名称（アクセシブルネーム用: 「東京都の統計を見る」） */
  prefName: string;
  /** タイル表示用の短縮名（「東京」） */
  shortName: string;
  regionCode: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AreaDirectoryData {
  regionGroups: AreaRegionGroup[];
  tiles: AreaTile[];
  /** タイル地図のグリッド列数 */
  gridCols: number;
  /** タイル地図のグリッド行数 */
  gridRows: number;
}

/** TILE_GRID_LAYOUT の id (1〜47) → 5 桁 prefCode ("13000") */
function tileIdToPrefCode(id: number): string {
  return `${String(id).padStart(2, "0")}000`;
}

export function buildAreaDirectoryData(
  prefectures: readonly Prefecture[],
): AreaDirectoryData {
  const prefMap = new Map(prefectures.map((p) => [p.prefCode, p]));

  const regionGroups: AreaRegionGroup[] = REGIONS.map((region) => ({
    regionCode: region.regionCode,
    regionName: region.regionName,
    prefectures: region.prefectures
      .map((code) => prefMap.get(code))
      .filter((p): p is Prefecture => p != null),
  }));

  const prefToRegion = new Map<string, string>();
  REGIONS.forEach((region) => {
    region.prefectures.forEach((code) => prefToRegion.set(code, region.regionCode));
  });

  let gridCols = 0;
  let gridRows = 0;
  const tiles: AreaTile[] = TILE_GRID_LAYOUT.map((cell) => {
    const prefCode = tileIdToPrefCode(cell.id);
    const pref = prefMap.get(prefCode);
    const w = cell.w ?? 1;
    const h = cell.h ?? 1;
    gridCols = Math.max(gridCols, cell.x + w);
    gridRows = Math.max(gridRows, cell.y + h);
    return {
      prefCode,
      prefName: pref?.prefName ?? cell.name,
      shortName: cell.name,
      regionCode: prefToRegion.get(prefCode) ?? "",
      x: cell.x,
      y: cell.y,
      w,
      h,
    };
  });

  return { regionGroups, tiles, gridCols, gridRows };
}
