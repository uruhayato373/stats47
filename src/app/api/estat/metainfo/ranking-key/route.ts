import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsDataId = searchParams.get("statsDataId");
    const categoryCode = searchParams.get("categoryCode");

    if (!statsDataId || !categoryCode) {
      return NextResponse.json(
        { error: "statsDataId と categoryCode が必要です" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // estat_ranking_config ビューを使用して ranking_key と ranking_items の設定を取得
    const result = await db
      .prepare(
        `SELECT 
           ranking_key,
           ranking_item_id,
           name,
           description,
           unit,
           label,
           data_source_id,
           map_color_scheme,
           map_diverging_midpoint,
           ranking_direction,
           conversion_factor,
           decimal_places,
           is_active,
           created_at,
           updated_at
         FROM estat_ranking_config 
         WHERE stats_data_id = ? 
         AND cat01 = ? 
         LIMIT 1`
      )
      .bind(statsDataId, categoryCode)
      .first();

    if (!result) {
      return NextResponse.json({
        ranking_key: null,
        ranking_item: null,
      });
    }

    return NextResponse.json({
      ranking_key: result.ranking_key,
      ranking_item: result.ranking_item_id
        ? {
            id: result.ranking_item_id,
            name: result.name,
            description: result.description,
            unit: result.unit,
            label: result.label,
            data_source_id: result.data_source_id,
            map_color_scheme: result.map_color_scheme,
            map_diverging_midpoint: result.map_diverging_midpoint,
            ranking_direction: result.ranking_direction,
            conversion_factor: result.conversion_factor,
            decimal_places: result.decimal_places,
            is_active: result.is_active,
            created_at: result.created_at,
            updated_at: result.updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error("ranking_config 取得エラー:", error);
    return NextResponse.json(
      { error: "ranking_config の取得に失敗しました" },
      { status: 500 }
    );
  }
}
