/**
 * Municipality Service
 * 市区町村に関するビジネスロジックを担当
 */

import {
  fetchMunicipalities,
  fetchMunicipalitiesByPrefecture,
  findMunicipalityByCode as findMunicipalityByCodeFromRepo,
} from "../repositories/area-repository";
import { Municipality, MunicipalityType } from "../types/index";

// ============================================================================
// リスト全体を取得（list動詞）
// ============================================================================

/**
 * 全ての市区町村を取得
 */
export async function listMunicipalities(): Promise<Municipality[]> {
  return await fetchMunicipalities();
}

/**
 * 特定の都道府県の市区町村を取得
 */
export async function listMunicipalitiesByPrefecture(
  prefectureCode: string
): Promise<Municipality[]> {
  return await fetchMunicipalitiesByPrefecture(prefectureCode);
}

/**
 * 市区町村タイプ別にフィルタリング
 */
export async function listMunicipalitiesByType(
  type: MunicipalityType
): Promise<Municipality[]> {
  const allMunicipalities = await fetchMunicipalities();
  return allMunicipalities.filter((muni) => muni.type === type);
}

/**
 * 特定の都道府県内で市区町村タイプ別にフィルタリング
 */
export async function listMunicipalitiesByTypeInPrefecture(
  prefectureCode: string,
  type: MunicipalityType
): Promise<Municipality[]> {
  const municipalities = await fetchMunicipalitiesByPrefecture(prefectureCode);
  return municipalities.filter((muni) => muni.type === type);
}

// ============================================================================
// 検索（find動詞、search動詞）
// ============================================================================

/**
 * 市区町村コードで検索
 */
export async function findMunicipalityByCode(
  code: string
): Promise<Municipality> {
  return await findMunicipalityByCodeFromRepo(code);
}

/**
 * 市区町村名で検索
 */
export async function searchMunicipalities(
  query: string
): Promise<Municipality[]> {
  const allMunicipalities = await fetchMunicipalities();
  const lowerQuery = query.toLowerCase();

  return allMunicipalities.filter((muni) =>
    muni.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 特定の都道府県内で市区町村名を検索
 */
export async function searchMunicipalitiesInPrefecture(
  prefectureCode: string,
  query: string
): Promise<Municipality[]> {
  const municipalities = await fetchMunicipalitiesByPrefecture(prefectureCode);
  const lowerQuery = query.toLowerCase();

  return municipalities.filter((muni) =>
    muni.name.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// dictionary/mapから読み出し（lookup動詞）
// ============================================================================

/**
 * 市区町村コードから市区町村名を取得
 */
export async function lookupMunicipalityName(
  code: string
): Promise<string | null> {
  try {
    const municipality = await findMunicipalityByCodeFromRepo(code);
    return municipality.name;
  } catch {
    return null;
  }
}

// ============================================================================
// 統計情報を構築（build動詞）
// ============================================================================

/**
 * 市区町村の統計情報を構築
 */
export async function buildMunicipalityStats(): Promise<{
  total: number;
  byType: Record<MunicipalityType, number>;
  byPrefecture: Record<string, number>;
}> {
  const municipalities = await fetchMunicipalities();

  const stats = {
    total: municipalities.length,
    byType: {
      city: 0,
      ward: 0,
      town: 0,
      village: 0,
    } as Record<MunicipalityType, number>,
    byPrefecture: {} as Record<string, number>,
  };

  municipalities.forEach((muni) => {
    // タイプ別カウント
    stats.byType[muni.type]++;

    // 都道府県別カウント
    if (!stats.byPrefecture[muni.prefectureCode]) {
      stats.byPrefecture[muni.prefectureCode] = 0;
    }
    stats.byPrefecture[muni.prefectureCode]++;
  });

  return stats;
}
