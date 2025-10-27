/**
 * Area API Route
 * 地域データ（都道府県・市区町村）のAPIエンドポイント
 */

import { NextResponse } from "next/server";

// R2公開URL（環境変数から取得）
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

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
      return NextResponse.json(
        { error: `Failed to fetch prefectures: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Area API] Error fetching prefectures:", error);
    return NextResponse.json(
      { error: "Failed to fetch prefectures" },
      { status: 500 }
    );
  }
}
