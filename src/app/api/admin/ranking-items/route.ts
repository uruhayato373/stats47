/**
 * ランキング項目管理API
 * POST /api/admin/ranking-items
 */

import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: バリデーション（zod など）

    const repository = await RankingRepository.create();
    // TODO: 新規作成処理を実装
    // const item = await repository.createRankingItem(body);

    return NextResponse.json(
      { message: "Created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Ranking Items API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const repository = await RankingRepository.create();
    const items = await repository.getAllRankingItems();

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("[Admin Ranking Items API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
