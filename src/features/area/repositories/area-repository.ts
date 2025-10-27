/**
 * Area Repository
 * 都道府県データのアクセス層を担当
 * すべての環境でR2ストレージからデータを取得
 */

import { PREFECTURE_TO_REGION_MAP } from "../constants/region-mapping";
import { City, DataSourceError, Prefecture } from "../types/index";

let prefecturesCache: Prefecture[] | null = null;
let regionsCache: Record<string, string[]> | null = null;
let citiesCache: City[] | null = null;

/**
 * 都道府県一覧を取得
 */
export async function fetchPrefectures(): Promise<Prefecture[]> {
  if (prefecturesCache) {
    return prefecturesCache;
  }

  try {
    // サーバーサイドのAPIルート経由で取得（CORS回避）
    const response = await fetch("/api/area/prefectures");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch prefectures: ${response.status} ${response.statusText}`
      );
    }
    const data = (await response.json()) as {
      prefectures: Prefecture[];
      regions: Record<string, string[]>;
    };

    prefecturesCache = data.prefectures;
    return data.prefectures;
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}

/**
 * 地域ブロックマップを取得
 */
export async function fetchRegions(): Promise<Record<string, string[]>> {
  if (regionsCache) {
    return regionsCache;
  }

  try {
    // サーバーサイドのAPIルート経由で取得（CORS回避）
    const response = await fetch("/api/area/prefectures");
    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`);
    }
    const data = (await response.json()) as {
      prefectures: Prefecture[];
      regions: Record<string, string[]>;
    };

    regionsCache = data.regions;
    return data.regions;
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}

/**
 * 市区町村一覧を取得
 */
export async function fetchCities(): Promise<City[]> {
  if (citiesCache) {
    return citiesCache;
  }

  try {
    // サーバーサイドのAPIルート経由で取得（CORS回避）
    const response = await fetch("/api/area/cities");
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`);
    }
    const jsonData = await response.json();
    const data = jsonData as { cities: City[] };

    citiesCache = data.cities;
    return data.cities;
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}

/**
 * 特定の都道府県の市区町村を取得
 */
export async function fetchCitiesByPrefecture(
  prefectureCode: string
): Promise<City[]> {
  const allCities = await fetchCities();
  return allCities.filter((city) => city.prefCode === prefectureCode);
}

/**
 * 特定の地域コードで都道府県を検索
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
 * 特定の市区町村コードで市区町村を検索
 */
export async function findCityByCode(code: string): Promise<City> {
  const cities = await fetchCities();
  const city = cities.find((c) => c.cityCode === code);

  if (!city) {
    throw new Error(`City not found: ${code}`);
  }

  return city;
}

/**
 * キャッシュをクリア
 */
export function clearAreaCache(): void {
  prefecturesCache = null;
  regionsCache = null;
  citiesCache = null;
}

/**
 * キャッシュ状態を構築
 */
export function buildAreaCacheStatus(): {
  prefectures: boolean;
  regions: boolean;
  cities: boolean;
} {
  return {
    prefectures: prefecturesCache !== null,
    regions: regionsCache !== null,
    cities: citiesCache !== null,
  };
}

/**
 * 都道府県コードから地域ブロックキーを取得
 */
export function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const code = prefCode.substring(0, 2);
  return PREFECTURE_TO_REGION_MAP[code] || "unknown";
}
