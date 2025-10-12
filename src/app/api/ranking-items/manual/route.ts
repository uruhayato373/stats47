import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

interface ManualRankingItemRequest {
  statsDataId: string;
  cdCat01: string;
  label?: string;
  name?: string;
  unit?: string;
  visualizationSettings: {
    map_color_scheme?: string;
    map_diverging_midpoint?: string;
    ranking_direction?: string;
    conversion_factor?: number;
    decimal_places?: number;
  };
}

/**
 * 手動入力用のランキングアイテムを作成するAPI
 * POST /api/ranking-items/manual
 *
 * Prefecture Rankingページで手動入力されたstatsDataId+categoryCodeの組み合わせ用に
 * ranking_itemsテーブルに新しいレコードを作成する
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ManualRankingItemRequest;
    const { statsDataId, cdCat01, label, name, unit, visualizationSettings } =
      body;

    if (!statsDataId || !cdCat01) {
      return NextResponse.json(
        { error: "statsDataId and cdCat01 are required" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // 既存レコードの確認
    const existingQuery = `
      SELECT id FROM ranking_items
      WHERE stats_data_id = ? AND cd_cat01 = ?
    `;
    const existing = await db
      .prepare(existingQuery)
      .bind(statsDataId, cdCat01)
      .first();

    if (existing) {
      // 既存レコードがある場合は更新
      const updateQuery = `
        UPDATE ranking_items
        SET
          map_color_scheme = ?,
          map_diverging_midpoint = ?,
          ranking_direction = ?,
          conversion_factor = ?,
          decimal_places = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE stats_data_id = ? AND cd_cat01 = ?
      `;

      await db
        .prepare(updateQuery)
        .bind(
          visualizationSettings.map_color_scheme || "interpolateBlues",
          visualizationSettings.map_diverging_midpoint || "zero",
          visualizationSettings.ranking_direction || "desc",
          visualizationSettings.conversion_factor || 1,
          visualizationSettings.decimal_places || 0,
          statsDataId,
          cdCat01
        )
        .run();

      return NextResponse.json({
        success: true,
        action: "updated",
        message: "Visualization settings updated successfully",
      });
    } else {
      // 新規レコードを作成
      const insertQuery = `
        INSERT INTO ranking_items (
          subcategory_id,
          ranking_key,
          label,
          stats_data_id,
          cd_cat01,
          unit,
          name,
          display_order,
          is_active,
          map_color_scheme,
          map_diverging_midpoint,
          ranking_direction,
          conversion_factor,
          decimal_places,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const rankingKey = `manual-${statsDataId}-${cdCat01}`;
      const subcategoryId = "manual-prefecture-ranking";
      const displayLabel = label || `Manual ${statsDataId}`;
      const displayName = name || `Manual Entry ${statsDataId}`;
      const displayUnit = unit || "";

      const result = await db
        .prepare(insertQuery)
        .bind(
          subcategoryId,
          rankingKey,
          displayLabel,
          statsDataId,
          cdCat01,
          displayUnit,
          displayName,
          -1, // display_order = -1 (手動レコードは通常リストに表示しない)
          1, // is_active = 1
          visualizationSettings.map_color_scheme || "interpolateBlues",
          visualizationSettings.map_diverging_midpoint || "zero",
          visualizationSettings.ranking_direction || "desc",
          visualizationSettings.conversion_factor || 1,
          visualizationSettings.decimal_places || 0
        )
        .run();

      return NextResponse.json({
        success: true,
        action: "created",
        message: "Manual ranking item created successfully",
        id: result.meta?.last_row_id,
      });
    }
  } catch (error) {
    console.error("Error creating/updating manual ranking item:", error);
    return NextResponse.json(
      { error: "Failed to create/update manual ranking item" },
      { status: 500 }
    );
  }
}
