import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * GET /api/rankings/groups/subcategory/[subcategoryId]
 * サブカテゴリのランキンググループを取得するAPIエンドポイント
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

    // リポジトリからランキンググループを取得
    const repository = await RankingRepository.create();
    const response = await repository.getRankingGroupsBySubcategory(
      subcategoryId
    );

    if (!response) {
      return NextResponse.json(
        { error: "No ranking groups found for this subcategory" },
        { status: 404 }
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching ranking groups:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ranking groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
