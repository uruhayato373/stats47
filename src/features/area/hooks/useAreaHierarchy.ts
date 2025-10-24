/**
 * Area Hierarchy Hooks
 * 地域階層構造に関するReact Hooks
 */

import useSWR from "swr";
import { AreaService } from "../services/area-service";
import { AreaLevel, AreaSearchOptions, AreaType } from "../types";

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
      dedupingInterval: 3600000, // 1時間
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
    dedupingInterval: 1800000, // 30分
  });
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
 * 特定レベルの地域を取得するフック
 */
export function useAreasByLevel(level: AreaLevel) {
  return useSWR(`areas-level-${level}`, () => AreaService.search({ level }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
}

/**
 * 特定タイプの地域を取得するフック
 */
export function useAreasByType(type: AreaType) {
  return useSWR(`areas-type-${type}`, () => AreaService.search({ type }), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
}
