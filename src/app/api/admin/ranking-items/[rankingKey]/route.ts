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

    const repository = await RankingRepository.create();

    // ランキング項目を更新
    const success = await repository.updateRankingItem(rankingKey, {
      label: body.label,
      name: body.name,
      description: body.description,
      unit: body.unit,
      dataSourceId: body.dataSourceId,
      mapColorScheme: body.mapColorScheme,
      mapDivergingMidpoint: body.mapDivergingMidpoint,
      rankingDirection: body.rankingDirection,
      conversionFactor: body.conversionFactor,
      decimalPlaces: body.decimalPlaces,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update ranking item" },
        { status: 500 }
      );
    }

    // メタデータがあれば更新
    if (body.metadataItems && Array.isArray(body.metadataItems)) {
      // 既存のメタデータを削除
      await repository.deleteDataSourceMetadataByRankingKey(rankingKey);

      // 新しいメタデータを保存
      for (const metadataItem of body.metadataItems) {
        try {
          const metadata = JSON.parse(metadataItem.metadata);
          await repository.createDataSourceMetadata({
            rankingKey,
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

    // メタデータを削除
    await repository.deleteDataSourceMetadataByRankingKey(rankingKey);

    // ランキング項目を削除（論理削除）
    const success = await repository.deleteRankingItem(rankingKey);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete ranking item" },
        { status: 500 }
      );
    }

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
