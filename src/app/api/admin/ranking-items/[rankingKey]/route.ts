/**
 * ランキング項目管理API
 * GET /api/admin/ranking-items/[rankingKey]
 * PUT /api/admin/ranking-items/[rankingKey]
 * DELETE /api/admin/ranking-items/[rankingKey]
 */

import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> }
) {
  try {
    const { rankingKey } = await params;
    const repository = await RankingRepository.create();
    const item = await repository.getRankingItemByKey(rankingKey);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("[Admin Ranking Items API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> }
) {
  try {
    const { rankingKey } = await params;
    const body = await request.json();

    // TODO: バリデーション（zod など）

    const repository = await RankingRepository.create();
    // TODO: 更新処理を実装
    // const item = await repository.updateRankingItem(rankingKey, body);

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Ranking Items API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> }
) {
  try {
    const { rankingKey } = await params;
    const repository = await RankingRepository.create();

    // TODO: 削除処理を実装
    // await repository.deleteRankingItem(rankingKey);

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Ranking Items API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
