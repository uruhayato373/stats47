/**
 * Area Repository
 * 都道府県データのアクセス層を担当
 * Next.js Fetch APIキャッシュを活用
 */

import { readFileSync } from "fs";
import { join } from "path";

import { City, DataSourceError, Prefecture } from "../types/index";

/**
 * 実行環境がサーバーサイドかどうかを判定
 */
function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * 開発環境かどうかを判定
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * ローカルモックデータから都道府県を読み込む
 */
function loadPrefecturesFromLocal(): Prefecture[] {
  const mockPath = join(
    process.cwd(),
    "data",
    "mock",
    "area",
    "prefectures.json"
  );
  try {
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
 * ローカルモックデータから市区町村を読み込む
 */
function loadCitiesFromLocal(): City[] {
  const mockPath = join(process.cwd(), "data", "mock", "area", "cities.json");
  try {
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
 * サーバーサイド: R2公開URLから直接取得（24時間キャッシュ）
 * クライアントサイド: APIルート経由で取得
 */
export async function fetchPrefectures(): Promise<Prefecture[]> {
  try {
    if (isServer()) {
      // サーバーサイド: 直接R2から取得を試行
      try {
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
        if (!R2_PUBLIC_URL) {
          throw new Error("R2_PUBLIC_URL is not configured");
        }
        console.log(
          `[AreaRepository] Attempting to fetch from R2: ${R2_PUBLIC_URL}/area/prefectures.json`
        );

        // 開発環境ではキャッシュなし、本番環境ではブラウザキャッシュ
        const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
          cache: "no-store", // 開発環境での動作確認用
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch prefectures from R2: ${response.status}`
          );
        }

        const data = (await response.json()) as Prefecture[];

        // 配列形式のみをサポート
        if (!Array.isArray(data)) {
          throw new Error("Invalid data structure: expected array");
        }

        console.log(
          `[AreaRepository] Successfully fetched ${data.length} prefectures from R2`
        );
        return data;
      } catch (r2Error) {
        // R2接続失敗時: 開発環境の場合のみフォールバック
        if (isDevelopment()) {
          console.warn(
            `[AreaRepository] R2 connection failed, falling back to local mock data:`,
            r2Error
          );
          const localData = loadPrefecturesFromLocal();
          console.log(
            `[AreaRepository] Successfully loaded ${localData.length} prefectures from local mock`
          );
          return localData;
        } else {
          // 本番環境ではエラーをスロー
          throw r2Error;
        }
      }
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/prefectures");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prefectures: ${response.status} ${response.statusText}`
        );
      }
      const data = (await response.json()) as Prefecture[];

      // 配列形式のみをサポート
      if (!Array.isArray(data)) {
        throw new Error("Invalid data structure: expected array");
      }
      return data;
    }
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}

/**
 * 市区町村一覧を取得
 * サーバーサイド: R2公開URLから直接取得（24時間キャッシュ）
 * クライアントサイド: APIルート経由で取得
 */
export async function fetchCities(): Promise<City[]> {
  try {
    if (isServer()) {
      // サーバーサイド: 直接R2から取得を試行
      try {
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
        if (!R2_PUBLIC_URL) {
          throw new Error("R2_PUBLIC_URL is not configured");
        }
        console.log(
          `[AreaRepository] Attempting to fetch from R2: ${R2_PUBLIC_URL}/area/cities.json`
        );

        const response = await fetch(`${R2_PUBLIC_URL}/area/cities.json`, {
          next: {
            revalidate: 86400, // 24時間キャッシュ
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cities from R2: ${response.status}`);
        }

        const data = (await response.json()) as City[];

        // 配列形式のみをサポート
        if (!Array.isArray(data)) {
          throw new Error("Invalid data structure: expected array");
        }

        console.log(
          `[AreaRepository] Successfully fetched ${data.length} cities from R2`
        );
        return data;
      } catch (r2Error) {
        // R2接続失敗時: 開発環境の場合のみフォールバック
        if (isDevelopment()) {
          console.warn(
            `[AreaRepository] R2 connection failed, falling back to local mock data:`,
            r2Error
          );
          const localData = loadCitiesFromLocal();
          console.log(
            `[AreaRepository] Successfully loaded ${localData.length} cities from local mock`
          );
          return localData;
        } else {
          // 本番環境ではエラーをスロー
          throw r2Error;
        }
      }
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/cities");
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }
      const data = (await response.json()) as City[];

      // 配列形式のみをサポート
      if (!Array.isArray(data)) {
        throw new Error("Invalid data structure: expected array");
      }
      return data;
    }
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}
