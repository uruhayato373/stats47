/**
 * GeoShapeデータ取得用SWRフック
 *
 * 自動キャッシング機能付きでGeoShapeデータを取得
 * クライアント側でのキャッシングとエラーハンドリングを提供
 */

import useSWR from "swr";
import { AutoCacheGeoShapeLoader } from "@/lib/area/geoshape/auto-cache-loader";
import type {
  GeoShapeDataLevel,
  LoadResult,
  LoadingState,
} from "@/lib/area/geoshape/types";

interface UseGeoShapeDataOptions {
  level?: GeoShapeDataLevel;
  prefectureCode: string;
  enabled?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

interface UseGeoShapeDataReturn {
  data: GeoJSON.FeatureCollection | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
  loadingState: LoadingState;
  loadResult: LoadResult | undefined;
}

/**
 * GeoShapeデータ取得フック
 *
 * @param options - オプション
 * @returns GeoShapeデータとローディング状態
 */
export function useGeoShapeData({
  level = "municipality",
  prefectureCode,
  enabled = true,
  revalidateOnFocus = false,
  revalidateOnReconnect = true,
}: UseGeoShapeDataOptions): UseGeoShapeDataReturn {
  const cacheKey = enabled ? `geoshape-${level}-${prefectureCode}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    cacheKey,
    async (): Promise<LoadResult> => {
      const startTime = performance.now();

      try {
        const geoJsonData = await AutoCacheGeoShapeLoader.loadWithAutoCache(
          level,
          prefectureCode
        );

        const loadTime = performance.now() - startTime;

        return {
          data: geoJsonData,
          source: "r2", // 実際の実装では、ソースを追跡
          cached: true,
          loadTime,
        };
      } catch (err) {
        const loadTime = performance.now() - startTime;

        // エラーでもロード時間は記録
        throw {
          ...err,
          loadTime,
        };
      }
    },
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval: 60000, // 1分間のデデュープ
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      shouldRetryOnError: (error) => {
        // ネットワークエラーやタイムアウトはリトライ
        return error.name === "TypeError" || error.name === "AbortError";
      },
    }
  );

  const loadingState: LoadingState = {
    isLoading: isLoading || isValidating,
    progress: data ? 100 : undefined,
    current: prefectureCode,
    total: 47,
  };

  return {
    data: data?.data,
    error: error as Error | undefined,
    isLoading: isLoading || isValidating,
    isValidating,
    mutate,
    loadingState,
    loadResult: data,
  };
}

/**
 * 複数の都道府県データを並列取得するフック
 *
 * @param level - データレベル
 * @param prefectureCodes - 都道府県コード配列
 * @param options - オプション
 * @returns 複数のGeoShapeデータ
 */
export function useMultipleGeoShapeData(
  level: GeoShapeDataLevel = "municipality",
  prefectureCodes: string[],
  options: {
    enabled?: boolean;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const results = prefectureCodes.map((prefCode) =>
    useGeoShapeData({
      level,
      prefectureCode: prefCode,
      ...options,
    })
  );

  return {
    data: results.map((result) => result.data),
    errors: results.map((result) => result.error),
    isLoading: results.some((result) => result.isLoading),
    isValidating: results.some((result) => result.isValidating),
    mutate: () => results.forEach((result) => result.mutate()),
    results,
  };
}

interface UsePrewarmCacheReturn {
  prewarmData: any;
  prewarmError: Error | undefined;
  isPrewarming: boolean;
  executePrewarm: () => Promise<void>;
}

/**
 * プリウォーム実行フック
 *
 * @param level - データレベル
 * @returns プリウォーム実行関数と状態
 */
export function usePrewarmCache(level: GeoShapeDataLevel = "municipality"): UsePrewarmCacheReturn {
  const { data, error, isLoading, mutate } = useSWR(
    `prewarm-${level}`,
    async () => {
      const response = await fetch("/api/area/geoshape/prewarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });

      if (!response.ok) {
        throw new Error(`Prewarm failed: ${response.statusText}`);
      }

      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const executePrewarm = async () => {
    await mutate();
  };

  return {
    prewarmData: data,
    prewarmError: error,
    isPrewarming: isLoading,
    executePrewarm,
  };
}
