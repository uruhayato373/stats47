import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * GET /api/rankings/item/[rankingKey]
 * ランキングキーでランキング項目を取得するAPIエンドポイント
 *
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - ルートパラメータ（rankingKey）
 * @returns Promise<NextResponse>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> }
) {
  try {
    const { rankingKey } = await params;

    if (!rankingKey) {
      return NextResponse.json(
        { error: "Ranking key is required" },
        { status: 400 }
      );
    }

    // リポジトリからランキング項目を取得
    const repository = await RankingRepository.create();
    const item = await repository.getRankingItemByKey(rankingKey);

    if (!item) {
      return NextResponse.json(
        { error: "Ranking item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("Error fetching ranking item:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ranking item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
