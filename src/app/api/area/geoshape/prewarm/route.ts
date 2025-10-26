/**
 * GeoShapeデータプリウォームAPI
 *
 * 全都道府県のGeoShapeデータを一括でR2キャッシュに保存
 * デプロイ後やメンテナンス時に実行
 */

import { NextRequest, NextResponse } from "next/server";

import { AutoCacheGeoShapeLoader } from "@/features/gis/geoshape/loaders/auto-cache-loader";
import type {
  PrewarmRequest,
  PrewarmResponse,
  PrewarmResult,
} from "@/features/gis/geoshape/types";

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body: PrewarmRequest = await request.json();
    const { level = "municipality" } = body;

    console.log(`[Prewarm API] Starting prewarm for level: ${level}`);

    // プリウォーム実行
    const results: PrewarmResult = await AutoCacheGeoShapeLoader.prewarmCache(
      level
    );

    const endTime = performance.now();
    const duration = `${((endTime - startTime) / 1000).toFixed(2)}s`;

    // レスポンス生成
    const response: PrewarmResponse = {
      success: results.failed === 0,
      message:
        results.failed === 0
          ? "Prewarm completed successfully"
          : `Prewarm completed with ${results.failed} errors`,
      level,
      results,
      summary: `Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      duration,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Prewarm API] Complete:`, response.summary);

    return NextResponse.json(response);
  } catch (error) {
    const endTime = performance.now();
    const duration = `${((endTime - startTime) / 1000).toFixed(2)}s`;

    console.error("[Prewarm API] Error:", error);

    const errorResponse: PrewarmResponse = {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      level: "municipality",
      results: {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [
          {
            prefectureCode: "unknown",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      },
      summary: "Prewarm failed",
      duration,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * プリウォーム状況の確認（GET）
 */
export async function GET() {
  try {
    // プリウォーム状況を確認するロジック
    // 実際の実装では、進行状況を追跡する仕組みが必要

    return NextResponse.json({
      status: "idle",
      message: "Prewarm status check not implemented yet",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Prewarm API] Status check error:", error);

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
