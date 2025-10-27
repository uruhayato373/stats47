/**
 * CityService
 * 市区町村に関するビジネスロジックを担当
 */

import { fetchCities } from "../repositories/area-repository";
import { City } from "../types/index";

// ============================================================================
// リスト全体を取得（list動詞）
// ============================================================================

/**
 * 全ての市区町村を取得
 */
export async function listMunicipalities(): Promise<City[]> {
  return await fetchCities();
}

/**
 * 特定の都道府県の市区町村を取得
 */
export async function listMunicipalitiesByPrefecture(
  prefectureCode: string
): Promise<City[]> {
  const allCities = await fetchCities();
  return allCities.filter((city) => city.prefCode === prefectureCode);
}

// ============================================================================
// 検索（find動詞、search動詞）
// ============================================================================

/**
 * 市区町村コードで検索
 */
export async function findMunicipalityByCode(code: string): Promise<City> {
  const cities = await fetchCities();
  const city = cities.find((c) => c.cityCode === code);

  if (!city) {
    throw new Error(`City not found: ${code}`);
  }

  return city;
}

/**
 * 市区町村名で検索
 */
export async function searchMunicipalities(query: string): Promise<City[]> {
  const allMunicipalities = await fetchCities();
  const lowerQuery = query.toLowerCase();

  return allMunicipalities.filter((city) =>
    city.cityName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 特定の都道府県内で市区町村名を検索
 */
export async function searchMunicipalitiesInPrefecture(
  prefectureCode: string,
  query: string
): Promise<City[]> {
  const municipalities = await listMunicipalitiesByPrefecture(prefectureCode);
  const lowerQuery = query.toLowerCase();

  return municipalities.filter((city) =>
    city.cityName.toLowerCase().includes(lowerQuery)
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
    const city = await findMunicipalityByCode(code);
    return city.cityName;
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
  byPrefecture: Record<string, number>;
}> {
  const cities = await fetchCities();

  const stats = {
    total: cities.length,
    byPrefecture: {} as Record<string, number>,
  };

  cities.forEach((city) => {
    // 都道府県別カウント
    if (!stats.byPrefecture[city.prefCode]) {
      stats.byPrefecture[city.prefCode] = 0;
    }
    stats.byPrefecture[city.prefCode]++;
  });

  return stats;
}
