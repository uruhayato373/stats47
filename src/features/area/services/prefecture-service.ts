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
 * 都道府県コードから地域ブロックキーを取得
 */
export function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const code = prefCode.substring(0, 2);
  return PREFECTURE_TO_REGION_MAP[code] || "unknown";
}

/**
 * 地域ブロックで都道府県を取得
 */
export async function listPrefecturesByRegion(
  regionKey: string
): Promise<Prefecture[]> {
  const allPrefectures = await fetchPrefectures();
  return allPrefectures.filter(
    (pref) => getRegionKeyFromPrefectureCode(pref.prefCode) === regionKey
  );
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

/**
 * 都道府県コードで検索
 */
export async function findPrefectureByCode(
  prefCode: string
): Promise<Prefecture> {
  const prefectures = await fetchPrefectures();
  const prefecture = prefectures.find((p) => p.prefCode === prefCode);

  if (!prefecture) {
    throw new Error(`Prefecture not found: ${prefCode}`);
  }

  return prefecture;
}

/**
 * 都道府県名で検索
 */
export async function searchPrefectures(query: string): Promise<Prefecture[]> {
  const allPrefectures = await fetchPrefectures();
  const lowerQuery = query.toLowerCase();

  return allPrefectures.filter((pref) =>
    pref.prefName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 都道府県コードから都道府県名を取得
 */
export async function lookupPrefectureName(
  prefCode: string
): Promise<string | null> {
  try {
    const prefecture = await findPrefectureByCode(prefCode);
    return prefecture.prefName;
  } catch {
    return null;
  }
}
