import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import {
  convertRankingItemFromDB,
  RankingItemDB,
} from "@/types/models/ranking";

/**
 * statsDataIdとcdCat01でランキングアイテムを検索するAPI
 * GET /api/ranking-items/by-stats?statsDataId=xxx&cdCat01=yyy
 *
 * Prefecture Rankingページで使用される手動入力のstatsDataId+categoryCodeから
 * 該当するranking_itemsレコードを検索し、可視化設定を取得する
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsDataId = searchParams.get("statsDataId");
    const cdCat01 = searchParams.get("cdCat01");

    if (!statsDataId || !cdCat01) {
      return NextResponse.json(
        { error: "statsDataId and cdCat01 are required" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // ranking_itemsテーブルから該当レコードを検索
    const query = `
      SELECT
        id, subcategory_id, ranking_key, label,
        stats_data_id, cd_cat01, unit, name,
        display_order, is_active,
        map_color_scheme, map_diverging_midpoint,
        ranking_direction, conversion_factor, decimal_places,
        created_at, updated_at
      FROM ranking_items
      WHERE stats_data_id = ? AND cd_cat01 = ?
      LIMIT 1
    `;

    const result = await db
      .prepare(query)
      .bind(statsDataId, cdCat01)
      .first<RankingItemDB>();

    if (result) {
      // 該当レコードが見つかった場合
      const rankingItem = convertRankingItemFromDB(result);

      return NextResponse.json({
        success: true,
        found: true,
        rankingItem,
        visualizationSettings: {
          map_color_scheme: rankingItem.mapColorScheme,
          map_diverging_midpoint: rankingItem.mapDivergingMidpoint,
          ranking_direction: rankingItem.rankingDirection,
          conversion_factor: rankingItem.conversionFactor,
          decimal_places: rankingItem.decimalPlaces,
        },
      });
    } else {
      // 該当レコードが見つからない場合、デフォルト設定を返す
      const defaultSettings = {
        map_color_scheme: "interpolateBlues",
        map_diverging_midpoint: "zero",
        ranking_direction: "desc",
        conversion_factor: 1,
        decimal_places: 0,
      };

      return NextResponse.json({
        success: true,
        found: false,
        rankingItem: null,
        visualizationSettings: defaultSettings,
      });
    }
  } catch (error) {
    console.error("Error fetching ranking item by stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch ranking item" },
      { status: 500 }
    );
  }
}
