/**
 * Area Repository (Server-only)
 *
 * 都道府県・市区町村データのサーバー側取得を担当するリポジトリ層。
 * このモジュールはサーバーサイドでのみ動作し、クライアントからの直接呼び出しは不可。
 *
 * ## データソース
 * - **本番環境**: R2ストレージの公開URLから取得（24時間キャッシュ）
 * - **開発環境**: R2接続失敗時はローカルのモックデータにフォールバック
 *
 * ## キャッシュ戦略
 * - **本番環境**: `force-cache` + `revalidate: 86400`（24時間）
 * - **開発環境**: `no-store`（常に最新データを取得）
 *
 * @module AreaRepository
 */

import { City, DataSourceError, Prefecture } from "../types/index";

/**
 * サーバーサイドでのみ実行可能であることを確認
 *
 * クライアントサイド（ブラウザ環境）からの呼び出しを防止するためのガード関数。
 * `window` オブジェクトの存在をチェックして実行環境を判定する。
 *
 * @throws {Error} クライアントサイドから呼び出された場合にエラーをスロー
 */
function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("AreaRepository is server-only");
  }
}

/**
 * 開発環境かどうかを判定
 *
 * `NODE_ENV` 環境変数をチェックして開発環境であるかを判定する。
 *
 * @returns {boolean} 開発環境の場合は `true`、それ以外は `false`
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * ローカルモックデータから都道府県一覧を読み込む（サーバーサイドのみ）
 *
 * 開発環境でR2ストレージへの接続が失敗した場合のフォールバック関数。
 * `data/mock/area/prefectures.json` から都道府県データを読み込む。
 *
 * ## ファイル形式
 * - ファイルパス: `data/mock/area/prefectures.json`
 * - 形式: JSON配列（`Prefecture[]`）
 *
 * @returns {Promise<Prefecture[]>} 都道府県データの配列
 * @throws {Error} ファイル読み込み失敗、JSON解析失敗、データ形式不正の場合にスロー
 *
 * @example
 * ```ts
 * const prefectures = await loadPrefecturesFromLocal();
 * console.log(`Loaded ${prefectures.length} prefectures`);
 * ```
 */
async function loadPrefecturesFromLocal(): Promise<Prefecture[]> {
  assertServer();

  try {
    // 動的インポートでfsモジュールを使用（Next.jsのEdge Runtime互換性のため）
    const { readFileSync } = await import("fs");
    const { join } = await import("path");

    const mockPath = join(
      process.cwd(),
      "data",
      "mock",
      "area",
      "prefectures.json"
    );

    const data = JSON.parse(readFileSync(mockPath, "utf-8"));
    // 配列形式のみをサポート
    if (!Array.isArray(data)) {
      throw new Error("Invalid data structure: expected array");
    }
    return data;
  } catch (error) {
    console.error("[AreaRepository] Failed to load local mock data:", error);
    throw error;
  }
}

/**
 * ローカルモックデータから市区町村一覧を読み込む（サーバーサイドのみ）
 *
 * 開発環境でR2ストレージへの接続が失敗した場合のフォールバック関数。
 * `data/mock/area/cities.json` から市区町村データを読み込む。
 *
 * ## ファイル形式
 * - ファイルパス: `data/mock/area/cities.json`
 * - 形式: JSON配列（`City[]`）
 *
 * @returns {Promise<City[]>} 市区町村データの配列
 * @throws {Error} ファイル読み込み失敗、JSON解析失敗、データ形式不正の場合にスロー
 *
 * @example
 * ```ts
 * const cities = await loadCitiesFromLocal();
 * console.log(`Loaded ${cities.length} cities`);
 * ```
 */
async function loadCitiesFromLocal(): Promise<City[]> {
  assertServer();

  try {
    // 動的インポートでfsモジュールを使用（Next.jsのEdge Runtime互換性のため）
    const { readFileSync } = await import("fs");
    const { join } = await import("path");

    const mockPath = join(process.cwd(), "data", "mock", "area", "cities.json");
    const data = JSON.parse(readFileSync(mockPath, "utf-8"));
    // 配列形式のみをサポート
    if (!Array.isArray(data)) {
      throw new Error("Invalid data structure: expected array");
    }
    return data;
  } catch (error) {
    console.error("[AreaRepository] Failed to load local mock data:", error);
    throw error;
  }
}

/**
 * 都道府県一覧を取得
 *
 * R2ストレージの公開URLから都道府県データを取得する。
 * サーバーサイドでのみ動作し、クライアントからの直接呼び出しは不可。
 *
 * ## データソース
 * 1. **R2ストレージ**: `${R2_PUBLIC_URL}/area/prefectures.json`
 * 2. **フォールバック**（開発環境のみ）: ローカルモックデータ（`data/mock/area/prefectures.json`）
 *
 * ## キャッシュ戦略
 * - **本番環境**: `force-cache` + `revalidate: 86400`（24時間再検証）
 *   - キャッシュタグ: `["area-prefectures"]`
 * - **開発環境**: `no-store`（キャッシュなし、常に最新データ）
 *
 * ## エラーハンドリング
 * - **本番環境**: R2接続失敗時は `DataSourceError` をスロー
 * - **開発環境**: R2接続失敗時は自動的にローカルモックデータにフォールバック
 *
 * @returns {Promise<Prefecture[]>} 都道府県データの配列
 * @throws {Error} `R2_PUBLIC_URL` が未設定の場合
 * @throws {Error} HTTPリクエストが失敗した場合（ステータスコードが200以外）
 * @throws {Error} レスポンスデータが配列形式でない場合
 * @throws {DataSourceError} 本番環境でR2接続が失敗した場合
 *
 * @example
 * ```ts
 * // Server Component 内で使用
 * const prefectures = await fetchPrefectures();
 * console.log(`Fetched ${prefectures.length} prefectures`);
 * ```
 */
export async function fetchPrefectures(): Promise<Prefecture[]> {
  assertServer();
  try {
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    if (!R2_PUBLIC_URL) {
      throw new Error("R2_PUBLIC_URL is not configured");
    }
    console.log(
      `[AreaRepository] Attempting to fetch from R2: ${R2_PUBLIC_URL}/area/prefectures.json`
    );

    const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
      cache: isDevelopment() ? "no-store" : "force-cache",
      next: isDevelopment()
        ? undefined
        : { revalidate: 86400, tags: ["area-prefectures"] },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch prefectures from R2: ${response.status}`
      );
    }

    const data = (await response.json()) as Prefecture[];
    if (!Array.isArray(data)) {
      throw new Error("Invalid data structure: expected array");
    }
    console.log(
      `[AreaRepository] Successfully fetched ${data.length} prefectures from R2`
    );
    return data;
  } catch (r2Error) {
    if (isDevelopment()) {
      console.warn(
        `[AreaRepository] R2 connection failed, falling back to local mock data:`,
        r2Error
      );
      const localData = await loadPrefecturesFromLocal();
      console.log(
        `[AreaRepository] Successfully loaded ${localData.length} prefectures from local mock`
      );
      return localData;
    }
    throw new DataSourceError("R2 storage", r2Error as Error);
  }
}

/**
 * 市区町村一覧を取得
 *
 * R2ストレージの公開URLから市区町村データを取得する。
 * サーバーサイドでのみ動作し、クライアントからの直接呼び出しは不可。
 *
 * ## データソース
 * 1. **R2ストレージ**: `${R2_PUBLIC_URL}/area/cities.json`
 * 2. **フォールバック**（開発環境のみ）: ローカルモックデータ（`data/mock/area/cities.json`）
 *
 * ## キャッシュ戦略
 * - **本番環境**: `force-cache` + `revalidate: 86400`（24時間再検証）
 *   - キャッシュタグ: `["area-cities"]`
 * - **開発環境**: `no-store`（キャッシュなし、常に最新データ）
 *
 * ## エラーハンドリング
 * - **本番環境**: R2接続失敗時は `DataSourceError` をスロー
 * - **開発環境**: R2接続失敗時は自動的にローカルモックデータにフォールバック
 *
 * @returns {Promise<City[]>} 市区町村データの配列
 * @throws {Error} `R2_PUBLIC_URL` が未設定の場合
 * @throws {Error} HTTPリクエストが失敗した場合（ステータスコードが200以外）
 * @throws {Error} レスポンスデータが配列形式でない場合
 * @throws {DataSourceError} 本番環境でR2接続が失敗した場合
 *
 * @example
 * ```ts
 * // Server Component 内で使用
 * const cities = await fetchCities();
 * console.log(`Fetched ${cities.length} cities`);
 * ```
 */
export async function fetchCities(): Promise<City[]> {
  assertServer();
  try {
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    if (!R2_PUBLIC_URL) {
      throw new Error("R2_PUBLIC_URL is not configured");
    }
    console.log(
      `[AreaRepository] Attempting to fetch from R2: ${R2_PUBLIC_URL}/area/cities.json`
    );

    const response = await fetch(`${R2_PUBLIC_URL}/area/cities.json`, {
      cache: isDevelopment() ? "no-store" : "force-cache",
      next: isDevelopment()
        ? undefined
        : { revalidate: 86400, tags: ["area-cities"] },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cities from R2: ${response.status}`);
    }

    const data = (await response.json()) as City[];
    if (!Array.isArray(data)) {
      throw new Error("Invalid data structure: expected array");
    }
    console.log(
      `[AreaRepository] Successfully fetched ${data.length} cities from R2`
    );
    return data;
  } catch (r2Error) {
    if (isDevelopment()) {
      console.warn(
        `[AreaRepository] R2 connection failed, falling back to local mock data:`,
        r2Error
      );
      const localData = await loadCitiesFromLocal();
      console.log(
        `[AreaRepository] Successfully loaded ${localData.length} cities from local mock`
      );
      return localData;
    }
    throw new DataSourceError("R2 storage", r2Error as Error);
  }
}
