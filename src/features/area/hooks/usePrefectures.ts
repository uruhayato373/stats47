/**
 * Area Domain React Hooks
 * SWRを使用したデータ取得とキャッシュ管理
 */

import useSWR from "swr";
import { AreaService } from "../services/area-service";
import { MunicipalityService } from "../services/municipality-service";
import { PrefectureService } from "../services/prefecture-service";
import {
  AreaSearchOptions,
  MunicipalitySearchOptions,
  PrefectureSearchOptions,
} from "../types";

// ============================================================================
// Prefecture Hooks
// ============================================================================

/**
 * 都道府県一覧を取得するフック
 */
export function usePrefectures() {
  return useSWR("prefectures", () => PrefectureService.getAllPrefectures(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000, // 1時間
  });
}

/**
 * 特定の都道府県を取得するフック
 */
export function usePrefecture(prefCode: string) {
  return useSWR(
    prefCode ? `prefecture-${prefCode}` : null,
    () => PrefectureService.getPrefectureByCode(prefCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 都道府県検索フック
 */
export function usePrefectureSearch(options: PrefectureSearchOptions) {
  const key = options.query || options.regionKey || "all-prefectures";

  return useSWR(
    `prefecture-search-${key}`,
    () => PrefectureService.search(options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1800000, // 30分
    }
  );
}

/**
 * 地域ブロック別都道府県取得フック
 */
export function usePrefecturesByRegion(regionKey: string) {
  return useSWR(
    regionKey ? `prefectures-region-${regionKey}` : null,
    () => PrefectureService.getPrefecturesByRegion(regionKey),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 地域ブロック一覧取得フック
 */
export function useRegions() {
  return useSWR("regions", () => PrefectureService.getRegions(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
}

// ============================================================================
// Municipality Hooks
// ============================================================================

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
      dedupingInterval: 3600000,
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
      dedupingInterval: 1800000,
    }
  );
}

/**
 * 市区町村タイプ別取得フック
 */
export function useMunicipalitiesByType(
  type: "city" | "ward" | "town" | "village"
) {
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

// ============================================================================
// Area Hierarchy Hooks
// ============================================================================

/**
 * 地域階層構造を取得するフック
 */
export function useAreaHierarchy(areaCode: string) {
  return useSWR(
    areaCode ? `area-hierarchy-${areaCode}` : null,
    () => AreaService.getAreaHierarchy(areaCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 階層パスを取得するフック
 */
export function useHierarchyPath(areaCode: string) {
  return useSWR(
    areaCode ? `hierarchy-path-${areaCode}` : null,
    () => AreaService.getHierarchyPath(areaCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 子要素を取得するフック
 */
export function useAreaChildren(areaCode: string) {
  return useSWR(
    areaCode ? `area-children-${areaCode}` : null,
    () => AreaService.getChildren(areaCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 親要素を取得するフック
 */
export function useAreaParent(areaCode: string) {
  return useSWR(
    areaCode ? `area-parent-${areaCode}` : null,
    () => AreaService.getParent(areaCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,
    }
  );
}

/**
 * 地域検索フック
 */
export function useAreaSearch(options: AreaSearchOptions) {
  const key = options.query || options.level || options.type || "all-areas";

  return useSWR(`area-search-${key}`, () => AreaService.search(options), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1800000,
  });
}

// ============================================================================
// Statistics Hooks
// ============================================================================

/**
 * 都道府県統計を取得するフック
 */
export function usePrefectureStatistics() {
  return useSWR(
    "prefecture-statistics",
    () => PrefectureService.getStatistics(),
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
 * 地域統計を取得するフック
 */
export function useAreaStatistics() {
  return useSWR("area-statistics", () => AreaService.getStatistics(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
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
