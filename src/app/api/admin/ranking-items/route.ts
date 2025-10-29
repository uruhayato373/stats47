/**
 * ランキング項目管理API
 * POST /api/admin/ranking-items
 */

import { NextRequest, NextResponse } from "next/server";

import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 必須フィールドのバリデーション
    if (
      !body.rankingKey ||
      !body.label ||
      !body.name ||
      !body.unit ||
      !body.dataSourceId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repository = await RankingRepository.create();

    // ランキング項目を作成
    const item = await repository.createRankingItem({
      rankingKey: body.rankingKey,
      label: body.label,
      name: body.name,
      description: body.description,
      unit: body.unit,
      dataSourceId: body.dataSourceId,
      mapColorScheme: body.mapColorScheme || "interpolateBlues",
      mapDivergingMidpoint: body.mapDivergingMidpoint || "zero",
      rankingDirection: body.rankingDirection || "desc",
      conversionFactor: body.conversionFactor ?? 1,
      decimalPlaces: body.decimalPlaces ?? 0,
    });

    // メタデータがあれば保存
    if (body.metadataItems && Array.isArray(body.metadataItems)) {
      for (const metadataItem of body.metadataItems) {
        try {
          const metadata = JSON.parse(metadataItem.metadata);
          await repository.createDataSourceMetadata({
            rankingKey: body.rankingKey,
            dataSourceId: metadataItem.dataSourceId,
            areaType: metadataItem.areaType,
            calculationType: metadataItem.calculationType,
            metadata,
          });
        } catch (error) {
          console.error("Failed to save metadata item:", error);
        }
      }
    }

    return NextResponse.json({ item }, { status: 201 });
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
