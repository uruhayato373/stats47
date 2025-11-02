/**
 * Geoshapeドメイン - リポジトリ
 *
 * データソースの抽象化とフォールバック戦略を提供。
 * メモリキャッシュ、R2ストレージ、外部APIからのTopoJSONデータ取得を統合管理。
 */

import {
  buildAllCitiesGeoshapeUrl,
  buildGeoshapeExternalUrl,
} from "../config/geoshape-config";

import type {
  AreaType,
  CityVersion,
  FetchOptions,
  FetchResult,
  TopoJSONTopology,
} from "../types/index";

// モジュールレベルのキャッシュ
const memoryCache = new Map<string, TopoJSONTopology>();
const cacheTimestamps = new Map<string, number>();

// 外部APIデータソース

/**
 * 外部APIからTopoJSONを取得
 *
 * Geoshapeリポジトリ（https://geoshape.ex.nii.ac.jp）からTopoJSONデータを取得する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns TopoJSONトポロジー
 * @throws 外部APIの取得に失敗した場合、または無効なTopoJSON形式の場合
 *
 * @example
 * ```typescript
 * const data = await fetchFromExternalAPI("prefecture");
 * const municipalityData = await fetchFromExternalAPI("municipality", "01", "merged");
 * ```
 */
export async function fetchFromExternalAPI(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged"
): Promise<TopoJSONTopology> {
  const url = buildGeoshapeExternalUrl(areaType, prefCode, version);

  try {
    console.log(`[ExternalAPI] Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "stats47-app/1.0",
      },
      signal: AbortSignal.timeout(10000), // 10秒タイムアウト
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const data: unknown = await response.json();

    // データの妥当性チェック
    if (
      !data ||
      typeof data !== "object" ||
      !("type" in data) ||
      (data as { type: unknown }).type !== "Topology"
    ) {
      throw new Error("Invalid TopoJSON format from external API");
    }

    console.log("[ExternalAPI] Successfully fetched data");
    return data as TopoJSONTopology;
  } catch (error) {
    console.error("[ExternalAPI] Failed to fetch:", error);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("External API request timeout");
    }

    throw new Error(
      `External API fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 外部APIから全国市区町村TopoJSONを取得
 *
 * 全ての市区町村を包含するTopoJSONデータを外部APIから取得する。
 *
 * @returns TopoJSONトポロジー
 * @throws 外部APIの取得に失敗した場合、または無効なTopoJSON形式の場合
 *
 * @example
 * ```typescript
 * const allCities = await fetchAllCitiesFromExternalAPI();
 * ```
 */
export async function fetchAllCitiesFromExternalAPI(): Promise<TopoJSONTopology> {
  const url = buildAllCitiesGeoshapeUrl();

  try {
    console.log(`[ExternalAPI] Fetching all cities from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "stats47-app/1.0",
      },
      signal: AbortSignal.timeout(30000), // 30秒タイムアウト（全国データは大きいため）
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const data: unknown = await response.json();

    // データの妥当性チェック
    if (
      !data ||
      typeof data !== "object" ||
      !("type" in data) ||
      (data as { type: unknown }).type !== "Topology"
    ) {
      throw new Error("Invalid TopoJSON format from external API");
    }

    console.log("[ExternalAPI] Successfully fetched all cities data");
    return data as TopoJSONTopology;
  } catch (error) {
    console.error("[ExternalAPI] Failed to fetch all cities:", error);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("External API request timeout");
    }

    throw new Error(
      `External API fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 外部APIが利用可能かチェック
 *
 * 外部APIのヘルスチェックを実行して、利用可能かどうかを判定する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns 利用可能な場合 `true`、それ以外は `false`
 */
export async function isExternalAPIAvailable(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged"
): Promise<boolean> {
  const url = buildGeoshapeExternalUrl(areaType, prefCode, version);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// R2ストレージデータソース

/**
 * R2ストレージが利用可能かチェック
 *
 * R2ストレージのヘルスチェックAPIを呼び出して、利用可能かどうかを判定する。
 *
 * @returns 利用可能な場合 `true`、それ以外は `false`
 */
export async function isR2Available(): Promise<boolean> {
  try {
    const response = await fetch("/api/gis/geoshape/r2/health");
    return response.ok;
  } catch {
    return false;
  }
}

// メインリポジトリ機能（フォールバック戦略）

/**
 * TopoJSONデータを取得（汎用メソッド）
 *
 * フォールバック順序: メモリキャッシュ → R2 → 外部API（+R2保存）
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @param options - 取得オプション
 * @returns TopoJSONデータと取得元情報
 * @throws すべてのデータソースが失敗した場合
 *
 * @example
 * ```typescript
 * const result = await fetchTopology("prefecture");
 * console.log(result.data); // TopoJSONデータ
 * console.log(result.source); // "memory" | "r2" | "external"
 * ```
 */
export async function fetchTopology(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged",
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

  // 2. R2ストレージ（APIルートが存在する場合のみ）
  // 注: APIルートが存在しない場合はスキップして外部APIにフォールバック
  // TODO: R2 APIルートを実装したら有効化
  // try {
  //   console.log(`[GeoshapeRepository] Trying R2 for ${cacheKey}`);
  //   const data = await fetchFromR2(areaType, prefCode, version);
  //   if (data) {
  //     saveToMemoryCache(cacheKey, data);
  //     return {
  //       data,
  //       source: "r2",
  //       timestamp: Date.now(),
  //     };
  //   }
  // } catch (error) {
  //   console.warn(`[GeoshapeRepository] R2 failed:`, error);
  // }

  // 3. 外部API（最後の手段）
  try {
    console.log(`[GeoshapeRepository] Trying ExternalAPI for ${cacheKey}`);
    const data = await fetchFromExternalAPI(areaType, prefCode, version);
    saveToMemoryCache(cacheKey, data);

    // R2にバックグラウンド保存（APIルートが存在する場合のみ）
    // TODO: R2 APIルートを実装したら有効化
    // saveToR2(data, areaType, prefCode, version).catch((err) => {
    //   console.warn(`[GeoshapeRepository] R2 background save failed:`, err);
    // });

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

// キャッシュ管理

/**
 * キャッシュをクリア
 *
 * メモリ内のすべてのキャッシュデータとタイムスタンプを削除する。
 */
export function clearGeoshapeCache(): void {
  memoryCache.clear();
  cacheTimestamps.clear();
  console.log("[GeoshapeRepository] Memory cache cleared");
}

/**
 * キャッシュステータスを構築
 *
 * メモリキャッシュのサイズとデータソースの可用性を返す。
 * 注意: R2と外部APIの可用性は非同期チェックが必要なため、常に `false` を返す。
 *
 * @returns キャッシュステータス情報
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

/**
 * データソースの可用性をチェック
 *
 * R2ストレージと外部APIの可用性を非同期で確認する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns 各データソースの可用性情報
 */
export async function checkDataSources(
  areaType: AreaType,
  prefCode?: string,
  version: CityVersion = "merged"
): Promise<{ r2: boolean; external: boolean }> {
  const results = await Promise.allSettled([
    isR2Available(),
    isExternalAPIAvailable(areaType, prefCode, version),
  ]);

  return {
    r2: results[0].status === "fulfilled" && results[0].value,
    external: results[1].status === "fulfilled" && results[1].value,
  };
}

// プライベート関数

/**
 * キャッシュキーを生成
 *
 * 地域タイプ、都道府県コード、市区町村版タイプから一意のキャッシュキーを生成する。
 * `national` と `prefecture` は同じキー（"prefecture"）を返す。
 *
 * @param areaType - 地域タイプ
 * @param prefCode - 都道府県コード（2桁）
 * @param version - 市区町村版タイプ
 * @returns キャッシュキー文字列
 */
function generateCacheKey(
  areaType: AreaType,
  prefCode?: string,
  version: CityVersion = "merged"
): string {
  if (areaType === "national" || areaType === "prefecture") {
    return "prefecture";
  }
  return `${areaType}_${prefCode}_${version}`;
}

/**
 * メモリキャッシュから取得
 *
 * キャッシュキーに対応するTopoJSONデータを取得する。
 * キャッシュが存在しない、または有効期限切れの場合は `null` を返す。
 *
 * @param key - キャッシュキー
 * @returns TopoJSONデータ、または `null`（キャッシュが存在しない、または有効期限切れの場合）
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
 *
 * TopoJSONデータと現在のタイムスタンプをメモリキャッシュに保存する。
 *
 * @param key - キャッシュキー
 * @param data - 保存するTopoJSONデータ
 */
function saveToMemoryCache(key: string, data: TopoJSONTopology): void {
  memoryCache.set(key, data);
  cacheTimestamps.set(key, Date.now());
  console.log(`[GeoshapeRepository] Cached: ${key}`);
}

/**
 * キャッシュの有効期限をチェック
 *
 * キャッシュキーに対応するデータが有効期限（24時間）を過ぎているかを判定する。
 *
 * @param key - キャッシュキー
 * @returns 有効期限切れの場合 `true`、それ以外は `false`
 */
function isCacheExpired(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) {
    return true;
  }

  const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24時間
  return Date.now() - timestamp > CACHE_EXPIRATION_MS;
}
