/**
 * Prefecture Service
 * 都道府県に関するビジネスロジックを担当
 */

import {
  fetchPrefectures,
  fetchRegions,
  findPrefectureByCode as findPrefectureByCodeFromRepo,
  getRegionKeyFromPrefectureCode,
} from "../repositories/area-repository";
import { Prefecture } from "../types/index";

/**
 * 全ての都道府県を取得
 */
export async function listPrefectures(): Promise<Prefecture[]> {
  return await fetchPrefectures();
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
 * 地域ブロック一覧を取得
 */
export async function listRegions(): Promise<Record<string, string[]>> {
  return await fetchRegions();
}

/**
 * 都道府県コードで検索
 */
export async function findPrefectureByCode(
  prefCode: string
): Promise<Prefecture> {
  return await findPrefectureByCodeFromRepo(prefCode);
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
