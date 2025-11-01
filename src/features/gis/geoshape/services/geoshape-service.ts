/**
 * Geoshapeドメイン - メインサービス
 * ビジネスロジックとデータ変換
 */

import {
  buildCacheStatus,
  checkDataSources as checkDataSourcesFromRepo,
  fetchTopology,
} from "../repositories/geoshape-repository";
import {
  fetchAllCitiesFromExternalAPI,
} from "../repositories/external-data-source";
import {
  determineAreaTypeFromCode,
  extractPrefCodeFrom5Digit,
} from "../utils/area-code-converter";
import { validateTopojson } from "../utils/topojson-converter";

import type {
  AreaType,
  FetchOptions,
  Cityersion,
  TopoJSONTopology,
} from "../types/index";

// ============================================================================
// TopoJSONを直接取得（fetch動詞）
// ============================================================================

/**
 * 都道府県のTopoJSONトポロジーを取得
 * @param options 取得オプション
 * @returns TopoJSONトポロジー
 */
export async function fetchPrefectureTopology(
  options: FetchOptions = {}
): Promise<TopoJSONTopology> {
  try {
    console.log("[GeoshapeService] Fetching prefecture topology...");

    // TopoJSONを取得
    const result = await fetchTopology(
      "prefecture",
      undefined,
      "merged",
      options
    );

    // データの妥当性チェック
    if (!validateTopojson(result.data)) {
      throw new Error("Invalid TopoJSON format");
    }

    console.log(`[GeoshapeService] Successfully fetched prefecture topology`);

    return result.data;
  } catch (error) {
    console.error(
      "[GeoshapeService] Failed to fetch prefecture topology:",
      error
    );
    throw new Error(
      `Failed to fetch prefecture topology: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 市区町村のTopoJSONトポロジーを取得
 * @param prefCode 都道府県コード（2桁）
 * @param version 市区町村版タイプ
 * @param options 取得オプション
 * @returns TopoJSONトポロジー
 */
export async function fetchMunicipalityTopology(
  prefCode: string,
  version: CityVersion = "merged",
  options: FetchOptions = {}
): Promise<TopoJSONTopology> {
  try {
    console.log(
      `[GeoshapeService] Fetching municipality topology for ${prefCode}...`
    );

    // TopoJSONを取得
    const result = await fetchTopology(
      "city",
      prefCode,
      version,
      options
    );

    // データの妥当性チェック
    if (!validateTopojson(result.data)) {
      throw new Error("Invalid TopoJSON format");
    }

    console.log(`[GeoshapeService] Successfully fetched municipality topology`);

    return result.data;
  } catch (error) {
    console.error(
      "[GeoshapeService] Failed to fetch municipality topology:",
      error
    );
    throw new Error(
      `Failed to fetch municipality topology: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 全国市区町村のTopoJSONトポロジーを取得
 * @param options 取得オプション
 * @returns TopoJSONトポロジー
 */
export async function fetchAllCitiesTopology(
  options: FetchOptions = {}
): Promise<TopoJSONTopology> {
  try {
    console.log("[GeoshapeService] Fetching all cities topology...");

    // 外部APIから直接取得（全国データは大きいため、現時点ではキャッシュをスキップ）
    const data = await fetchAllCitiesFromExternalAPI();

    // データの妥当性チェック
    if (!validateTopojson(data)) {
      throw new Error("Invalid TopoJSON format");
    }

    console.log(`[GeoshapeService] Successfully fetched all cities topology`);

    return data;
  } catch (error) {
    console.error(
      "[GeoshapeService] Failed to fetch all cities topology:",
      error
    );
    throw new Error(
      `Failed to fetch all cities topology: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 地域コードに基づいてTopoJSONトポロジーを取得
 * @param areaCode 地域コード（5桁）
 * @param version 市区町村版タイプ
 * @param options 取得オプション
 * @returns TopoJSONトポロジー
 */
export async function fetchTopologyByAreaCode(
  areaCode: string,
  version: CityVersion = "merged",
  options: FetchOptions = {}
): Promise<TopoJSONTopology> {
  try {
    console.log(
      `[GeoshapeService] Fetching topology for area code: ${areaCode}`
    );

    const areaType = determineAreaTypeFromCode(areaCode);

    if (areaType === "national" || areaType === "prefecture") {
      return await fetchPrefectureTopology(options);
    } else {
      const prefCode = extractPrefCodeFrom5Digit(areaCode);
      return await fetchMunicipalityTopology(prefCode, version, options);
    }
  } catch (error) {
    console.error(
      "[GeoshapeService] Failed to fetch topology by area code:",
      error
    );
    throw new Error(
      `Failed to fetch topology by area code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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
  version: CityVersion = "merged"
): Promise<{ mock: boolean; r2: boolean; external: boolean }> {
  return await checkDataSourcesFromRepo(areaType, prefCode, version);
}

// ============================================================================
// キャッシュステータスを構築（既存のまま）
// ============================================================================

/**
 * キャッシュステータスを構築
 */
export function getCacheStatus(): {
  memoryCache: number;
  r2Available: boolean;
  externalAvailable: boolean;
} {
  return buildCacheStatus();
}
