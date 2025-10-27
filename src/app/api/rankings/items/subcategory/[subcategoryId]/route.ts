import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * GET /api/rankings/items/subcategory/[subcategoryId]
 * サブカテゴリのランキング項目を取得するAPIエンドポイント
 *
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - ルートパラメータ（subcategoryId）
 * @returns Promise<NextResponse>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    if (!subcategoryId) {
      return NextResponse.json(
        { error: "Subcategory ID is required" },
        { status: 400 }
      );
    }

    // リポジトリからランキング項目を取得
    const repository = await RankingRepository.create();
    const config = await repository.getRankingItemsBySubcategory(subcategoryId);

    if (!config) {
      return NextResponse.json(
        { error: "No ranking items found for this subcategory" },
        { status: 404 }
      );
    }

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error("Error fetching ranking items:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ranking items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
