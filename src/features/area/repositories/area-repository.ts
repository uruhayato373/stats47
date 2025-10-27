/**
 * Area Repository
 * 都道府県データのアクセス層を担当
 * Next.js Fetch APIキャッシュを活用
 */

import { City, DataSourceError, Prefecture } from "../types/index";

/**
 * 実行環境がサーバーサイドかどうかを判定
 */
function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * 都道府県一覧を取得
 * サーバーサイド: R2公開URLから直接取得（24時間キャッシュ）
 * クライアントサイド: APIルート経由で取得
 */
export async function fetchPrefectures(): Promise<Prefecture[]> {
  try {
    if (isServer()) {
      // サーバーサイド: 直接R2から取得
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      if (!R2_PUBLIC_URL) {
        throw new Error("R2_PUBLIC_URL is not configured");
      }
      // 開発環境ではキャッシュなし、本番環境ではブラウザキャッシュ
      const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
        cache: "no-store", // 開発環境での動作確認用
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prefectures from R2: ${response.status}`
        );
      }
      const data = (await response.json()) as
        | Prefecture[]
        | { prefectures: Prefecture[] };

      // データ構造を判定: 配列なら直接返す、オブジェクトならprefecturesプロパティを返す
      if (Array.isArray(data)) {
        return data;
      } else if ("prefectures" in data) {
        return data.prefectures;
      }
      throw new Error(
        "Invalid data structure: expected array or object with prefectures property"
      );
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/prefectures");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prefectures: ${response.status} ${response.statusText}`
        );
      }
      const data = (await response.json()) as
        | Prefecture[]
        | { prefectures: Prefecture[] };

      // データ構造を判定
      if (Array.isArray(data)) {
        return data;
      } else if ("prefectures" in data) {
        return data.prefectures;
      }
      throw new Error(
        "Invalid data structure: expected array or object with prefectures property"
      );
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
      // サーバーサイド: 直接R2から取得（Next.jsキャッシュ利用）
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      if (!R2_PUBLIC_URL) {
        throw new Error("R2_PUBLIC_URL is not configured");
      }
      const response = await fetch(`${R2_PUBLIC_URL}/area/cities.json`, {
        next: {
          revalidate: 86400, // 24時間キャッシュ
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cities from R2: ${response.status}`);
      }
      const data = (await response.json()) as City[] | { cities: City[] };

      // データ構造を判定: 配列なら直接返す、オブジェクトならcitiesプロパティを返す
      if (Array.isArray(data)) {
        return data;
      } else if ("cities" in data) {
        return data.cities;
      }
      throw new Error(
        "Invalid data structure: expected array or object with cities property"
      );
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/cities");
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }
      const data = (await response.json()) as City[] | { cities: City[] };

      // データ構造を判定
      if (Array.isArray(data)) {
        return data;
      } else if ("cities" in data) {
        return data.cities;
      }
      throw new Error(
        "Invalid data structure: expected array or object with cities property"
      );
    }
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}
