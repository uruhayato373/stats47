/**
 * Area API Route
 * 地域データ（都道府県・市区町村）のAPIエンドポイント
 */

import { NextResponse } from "next/server";

// R2公開URL（環境変数から取得）
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// 環境判定関数
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * GET /api/area/prefectures
 * 都道府県一覧を取得
 */
export async function GET() {
  try {
    if (!R2_PUBLIC_URL) {
      return NextResponse.json(
        { error: "R2_PUBLIC_URL is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
      next: {
        revalidate: 86400, // 24時間キャッシュ
        tags: ["area-prefectures"],
      },
    });

    if (!response.ok) {
      // 開発環境でフォールバック
      if (isDevelopment()) {
        console.warn(
          `[Area API] R2 connection failed (${response.status}), falling back to local mock data`
        );
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
        console.log(
          `[Area API] Successfully loaded ${
            Array.isArray(data) ? data.length : 0
          } prefectures from local mock`
        );
        return NextResponse.json(data);
      }

      return NextResponse.json(
        { error: `Failed to fetch prefectures: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Area API] Error fetching prefectures:", error);

    // 開発環境でフォールバック
    if (isDevelopment()) {
      try {
        console.warn(
          "[Area API] R2 connection error, falling back to local mock data"
        );
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
        console.log(
          `[Area API] Successfully loaded ${
            Array.isArray(data) ? data.length : 0
          } prefectures from local mock`
        );
        return NextResponse.json(data);
      } catch (fallbackError) {
        console.error(
          "[Area API] Failed to load local mock data:",
          fallbackError
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch prefectures" },
      { status: 500 }
    );
  }
}
