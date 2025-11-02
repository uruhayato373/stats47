/**
 * Geoshapeドメイン - サービス
 *
 * TopoJSONデータの取得とビジネスロジックを提供。
 * リポジトリ層へのアクセスを抽象化し、データの妥当性チェックを行う。
 */

import {
  fetchAllCitiesFromExternalAPI,
  fetchTopology,
} from "../repositories/geoshape-repository";
import { validateTopojson } from "../utils/topojson-converter";

import type {
  CityVersion,
  FetchOptions,
  TopoJSONTopology,
} from "../types/index";

/**
 * 都道府県のTopoJSONトポロジーを取得
 *
 * 都道府県全体のTopoJSONデータを取得し、妥当性チェックを行う。
 *
 * @param options - 取得オプション（キャッシュ使用、強制リフレッシュなど）
 * @returns TopoJSONトポロジー
 * @throws データ取得に失敗した場合、または無効なTopoJSON形式の場合
 *
 * @example
 * ```typescript
 * const data = await fetchPrefectureTopology();
 * const freshData = await fetchPrefectureTopology({ forceRefresh: true });
 * ```
 */
export async function fetchPrefectureTopology(
  options: FetchOptions = {}
): Promise<TopoJSONTopology> {
  try {
    console.log("[GeoshapeService] Fetching prefecture topology...");

    const result = await fetchTopology(
      "prefecture",
      undefined,
      "merged",
      options
    );

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
 *
 * 指定された都道府県の市区町村TopoJSONデータを取得し、妥当性チェックを行う。
 *
 * @param prefCode - 都道府県コード（2桁、例: "01", "47"）
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @param options - 取得オプション（キャッシュ使用、強制リフレッシュなど）
 * @returns TopoJSONトポロジー
 * @throws データ取得に失敗した場合、または無効なTopoJSON形式の場合
 *
 * @example
 * ```typescript
 * const data = await fetchMunicipalityTopology("01", "merged");
 * ```
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

    const result = await fetchTopology("city", prefCode, version, options);

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
 *
 * 全ての市区町村を包含するTopoJSONデータを外部APIから直接取得する。
 * 注意: 全国データは大きいため、現時点ではキャッシュをスキップして直接取得する。
 *
 * @returns TopoJSONトポロジー
 * @throws データ取得に失敗した場合、または無効なTopoJSON形式の場合
 *
 * @example
 * ```typescript
 * const allCities = await fetchAllCitiesTopology();
 * ```
 */
export async function fetchAllCitiesTopology(): Promise<TopoJSONTopology> {
  try {
    console.log("[GeoshapeService] Fetching all cities topology...");

    const data = await fetchAllCitiesFromExternalAPI();

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
