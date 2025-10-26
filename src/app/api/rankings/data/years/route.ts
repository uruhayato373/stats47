/**
 * 新API: ranking_key の利用可能年度取得
 * 作成日: 2025-01-13
 * 目的: データソース非依存の年度取得
 *
 * GET /api/ranking/years?rankingKey=totalArea
 */

import { NextRequest, NextResponse } from "next/server";

import { RankingCacheService } from "@/features/ranking/services/ranking-cache-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rankingKey = searchParams.get("rankingKey");

    // パラメータの検証
    if (!rankingKey) {
      return NextResponse.json(
        { error: "rankingKey is required" },
        { status: 400 }
      );
    }

    // ranking_key の存在確認
    const exists = await RankingCacheService.existsRankingKey(rankingKey);
    if (!exists) {
      return NextResponse.json(
        { error: `Ranking key '${rankingKey}' not found` },
        { status: 404 }
      );
    }

    // 利用可能年度取得
    const years = await RankingCacheService.getAvailableYears(rankingKey);

    return NextResponse.json({ years });
  } catch (error) {
    console.error("Error in /api/ranking/years:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
