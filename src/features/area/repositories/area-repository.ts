/**
 * Area Repository (Server-only)
 * 都道府県/市区町村データのサーバー側取得ユーティリティ
 */

import { City, DataSourceError, Prefecture } from "../types/index";

// サーバー専用ユーティリティのため、クライアントからの呼び出しは不許可
function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("AreaRepository is server-only");
  }
}

/**
 * 開発環境かどうかを判定
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * ローカルモックデータから都道府県を読み込む（サーバーサイドのみ）
 */
async function loadPrefecturesFromLocal(): Promise<Prefecture[]> {
  assertServer();

  try {
    // 動的インポートでfsモジュールを使用
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
 * ローカルモックデータから市区町村を読み込む（サーバーサイドのみ）
 */
async function loadCitiesFromLocal(): Promise<City[]> {
  assertServer();

  try {
    // 動的インポートでfsモジュールを使用
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
 * サーバーサイド: R2公開URLから直接取得（24時間キャッシュ）
 * クライアントサイド: APIルート経由で取得
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
 * サーバーサイド: R2公開URLから直接取得（24時間キャッシュ）
 * クライアントサイド: APIルート経由で取得
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
