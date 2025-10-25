/**
 * 新API: ranking_key ベースのデータ取得
 * 作成日: 2025-01-13
 * 目的: データソース非依存のランキングデータ取得
 *
 * GET /api/ranking/data?rankingKey=totalArea&timeCode=2020000000
 */

import { NextRequest, NextResponse } from "next/server";

import { RankingCacheService } from "@/lib/ranking/RankingCacheService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rankingKey = searchParams.get("rankingKey");
    const timeCode = searchParams.get("timeCode");

    // パラメータの検証
    if (!rankingKey || !timeCode) {
      return NextResponse.json(
        { error: "rankingKey and timeCode are required" },
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

    // データ取得
    const data = await RankingCacheService.getRankingData(rankingKey, timeCode);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in /api/ranking/data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
