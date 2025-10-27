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
    let data: {
      prefectures: Prefecture[];
      regions: Record<string, string[]>;
    };

    if (isServer()) {
      // サーバーサイド: 直接R2から取得（Next.jsキャッシュ利用）
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      if (!R2_PUBLIC_URL) {
        throw new Error("R2_PUBLIC_URL is not configured");
      }
      const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
        next: {
          revalidate: 86400, // 24時間キャッシュ
          tags: ["area-prefectures"],
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prefectures from R2: ${response.status}`
        );
      }
      data = await response.json();
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/prefectures");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch prefectures: ${response.status} ${response.statusText}`
        );
      }
      data = await response.json();
    }

    return data.prefectures;
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
    let data: { cities: City[] };

    if (isServer()) {
      // サーバーサイド: 直接R2から取得（Next.jsキャッシュ利用）
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      if (!R2_PUBLIC_URL) {
        throw new Error("R2_PUBLIC_URL is not configured");
      }
      const response = await fetch(`${R2_PUBLIC_URL}/area/cities.json`, {
        next: {
          revalidate: 86400, // 24時間キャッシュ
          tags: ["area-cities"],
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cities from R2: ${response.status}`);
      }
      data = await response.json();
    } else {
      // クライアントサイド: API経由
      const response = await fetch("/api/area/cities");
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }
      data = await response.json();
    }

    return data.cities;
  } catch (error) {
    throw new DataSourceError("R2 storage", error as Error);
  }
}
