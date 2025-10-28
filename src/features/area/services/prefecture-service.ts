/**
 * Prefecture Service
 * 都道府県に関するビジネスロジックを担当
 */

import { PREFECTURE_TO_REGION_MAP, REGIONS } from "../constants/region-mapping";
import { fetchPrefectures } from "../repositories/area-repository";
import { Prefecture } from "../types/index";

/**
 * 全ての都道府県を取得
 */
export async function listPrefectures(): Promise<Prefecture[]> {
  return await fetchPrefectures();
}

/**
 * 都道府県コードで検索
 */
export async function findPrefectureByCode(
  prefCode: string
): Promise<Prefecture | null> {
  const prefectures = await fetchPrefectures();
  return prefectures.find((p) => p.prefCode === prefCode) || null;
}

/**
 * 都道府県コードから地域ブロックキーを取得
 */
export function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const code = prefCode.substring(0, 2);
  return PREFECTURE_TO_REGION_MAP[code] || "unknown";
}

/**
 * 都道府県データから地域マッピングを生成
 *
 * @returns 地域コード → 都道府県コード配列のマップ
 */
export function buildRegionMapping(): Record<string, string[]> {
  const regionMap: Record<string, string[]> = {};

  // REGIONS定数から地域構造を構築
  REGIONS.forEach((region) => {
    regionMap[region.regionCode] = region.prefectures;
  });

  return regionMap;
}

/**
 * 地域ブロック一覧を取得
 * 都道府県データから地域マッピングを生成して返す
 */
export async function listRegions(): Promise<Record<string, string[]>> {
  return buildRegionMapping();
}
