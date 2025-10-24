/**
 * Municipality Hooks
 * 市区町村に関するReact Hooks
 */

import useSWR from "swr";
import { MunicipalityService } from "../services/municipality-service";
import { MunicipalitySearchOptions, MunicipalityType } from "../types";

/**
 * 市区町村一覧を取得するフック
 */
export function useMunicipalities() {
  return useSWR(
    "municipalities",
    () => MunicipalityService.getAllMunicipalities(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1時間
    }
  );
}

/**
 * 特定の市区町村を取得するフック
 */
export function useMunicipality(code: string) {
  return useSWR(
    code ? `municipality-${code}` : null,
    () => MunicipalityService.getMunicipalityByCode(code),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 特定の都道府県の市区町村を取得するフック
 */
export function useMunicipalitiesByPrefecture(prefCode: string) {
  return useSWR(
    prefCode ? `municipalities-pref-${prefCode}` : null,
    () => MunicipalityService.getMunicipalitiesByPrefecture(prefCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 市区町村検索フック
 */
export function useMunicipalitySearch(options: MunicipalitySearchOptions) {
  const key =
    options.query || options.prefCode || options.type || "all-municipalities";

  return useSWR(
    `municipality-search-${key}`,
    () => MunicipalityService.search(options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1800000, // 30分
    }
  );
}

/**
 * 市区町村タイプ別取得フック
 */
export function useMunicipalitiesByType(type: MunicipalityType) {
  return useSWR(
    `municipalities-type-${type}`,
    () => MunicipalityService.getMunicipalitiesByType(type),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 階層レベル別取得フック
 */
export function useMunicipalitiesByLevel(level: number) {
  return useSWR(
    `municipalities-level-${level}`,
    () => MunicipalityService.getMunicipalitiesByLevel(level),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 政令指定都市の区を取得するフック
 */
export function useWardsByCity(cityCode: string) {
  return useSWR(
    cityCode ? `wards-city-${cityCode}` : null,
    () => MunicipalityService.getWardsByCity(cityCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 市区町村統計を取得するフック
 */
export function useMunicipalityStatistics() {
  return useSWR(
    "municipality-statistics",
    () => MunicipalityService.getStatistics(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 特定の都道府県の市区町村統計を取得するフック
 */
export function usePrefectureMunicipalityStatistics(prefCode: string) {
  return useSWR(
    prefCode ? `prefecture-municipality-stats-${prefCode}` : null,
    () => MunicipalityService.getPrefectureStatistics(prefCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}
