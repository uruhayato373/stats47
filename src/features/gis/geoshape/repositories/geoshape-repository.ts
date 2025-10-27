/**
 * Geoshapeドメイン - メインリポジトリ
 * データソースの抽象化とフォールバック戦略
 */

import { isMockEnvironment } from "../config/geoshape-config";

import {
  fetchFromExternalAPI,
  isExternalAPIAvailable,
} from "./external-data-source";
import { fetchFromMockData, isMockDataAvailable } from "./mock-data-source";
import { fetchFromR2, isR2Available } from "./r2-data-source";

import type {
  AreaType,
  FetchOptions,
  FetchResult,
  MunicipalityVersion,
  TopoJSONTopology,
} from "../types/index";

// ============================================================================
// モジュールレベルのキャッシュ
// ============================================================================

const memoryCache = new Map<string, TopoJSONTopology>();
const cacheTimestamps = new Map<string, number>();

// ============================================================================
// TopoJSONデータを取得（fetch動詞）
// ============================================================================

/**
 * TopoJSONデータを取得（汎用メソッド）
 * フォールバック順序: メモリキャッシュ → Mock → R2 → 外部API
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）- municipalityで必須
 * @param version 市区町村版タイプ
 * @param options 取得オプション
 */
export async function fetchTopology(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged",
  options: FetchOptions = {}
): Promise<FetchResult<TopoJSONTopology>> {
  const { useCache = true, forceRefresh = false } = options;

  // キャッシュキーを生成
  const cacheKey = generateCacheKey(areaType, prefCode, version);

  // 1. メモリキャッシュチェック
  if (useCache && !forceRefresh) {
    const cached = getFromMemoryCache(cacheKey);
    if (cached) {
      console.log(`[GeoshapeRepository] Cache hit: ${cacheKey}`);
      return {
        data: cached,
        source: "memory",
        timestamp: cacheTimestamps.get(cacheKey) || Date.now(),
      };
    }
  }

  // 2. Mockデータソース（開発環境）
  if (isMockEnvironment()) {
    try {
      console.log(`[GeoshapeRepository] Trying MockData for ${cacheKey}`);
      const data = await fetchFromMockData(areaType, prefCode, version);
      if (data) {
        saveToMemoryCache(cacheKey, data);
        return {
          data,
          source: "mock",
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.warn(`[GeoshapeRepository] MockData failed:`, error);
    }
  }

  // 3. R2ストレージ
  try {
    console.log(`[GeoshapeRepository] Trying R2 for ${cacheKey}`);
    const data = await fetchFromR2(areaType, prefCode, version);
    if (data) {
      saveToMemoryCache(cacheKey, data);
      return {
        data,
        source: "r2",
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    console.warn(`[GeoshapeRepository] R2 failed:`, error);
  }

  // 4. 外部API（最後の手段）
  try {
    console.log(`[GeoshapeRepository] Trying ExternalAPI for ${cacheKey}`);
    const data = await fetchFromExternalAPI(areaType, prefCode, version);
    saveToMemoryCache(cacheKey, data);
    return {
      data,
      source: "external",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`[GeoshapeRepository] All data sources failed:`, error);
    throw new Error(
      `Failed to fetch topology data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ============================================================================
// キャッシュ管理
// ============================================================================

/**
 * キャッシュをクリア
 */
export function clearGeoshapeCache(): void {
  memoryCache.clear();
  cacheTimestamps.clear();
  console.log("[GeoshapeRepository] Memory cache cleared");
}

/**
 * キャッシュステータスを構築
 */
export function buildCacheStatus(): {
  memoryCache: number;
  r2Available: boolean;
  externalAvailable: boolean;
} {
  return {
    memoryCache: memoryCache.size,
    r2Available: false, // 非同期チェックが必要
    externalAvailable: false, // 非同期チェックが必要
  };
}

// ============================================================================
// データソース可用性チェック
// ============================================================================

/**
 * データソースの可用性をチェック
 */
export async function checkDataSources(
  areaType: AreaType,
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): Promise<{ mock: boolean; r2: boolean; external: boolean }> {
  const results = await Promise.allSettled([
    isMockDataAvailable(areaType, prefCode, version),
    isR2Available(),
    isExternalAPIAvailable(areaType, prefCode, version),
  ]);

  return {
    mock: results[0].status === "fulfilled" && results[0].value,
    r2: results[1].status === "fulfilled" && results[1].value,
    external: results[2].status === "fulfilled" && results[2].value,
  };
}

// ============================================================================
// プライベート関数（非エクスポート）
// ============================================================================

/**
 * キャッシュキーを生成
 */
function generateCacheKey(
  areaType: AreaType,
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): string {
  if (areaType === "country" || areaType === "prefecture") {
    return "prefecture";
  }
  return `${areaType}_${prefCode}_${version}`;
}

/**
 * メモリキャッシュから取得
 */
function getFromMemoryCache(key: string): TopoJSONTopology | null {
  const data = memoryCache.get(key);

  if (!data) {
    return null;
  }

  // キャッシュの有効期限チェック（24時間）
  const timestamp = cacheTimestamps.get(key);
  if (timestamp && isCacheExpired(key)) {
    memoryCache.delete(key);
    cacheTimestamps.delete(key);
    console.log(`[GeoshapeRepository] Cache expired: ${key}`);
    return null;
  }

  return data;
}

/**
 * メモリキャッシュに保存
 */
function saveToMemoryCache(key: string, data: TopoJSONTopology): void {
  memoryCache.set(key, data);
  cacheTimestamps.set(key, Date.now());
  console.log(`[GeoshapeRepository] Cached: ${key}`);
}

/**
 * キャッシュの有効期限チェック
 */
function isCacheExpired(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) {
    return true;
  }

  const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24時間
  return Date.now() - timestamp > CACHE_EXPIRATION_MS;
}
