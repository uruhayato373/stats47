import { NextRequest, NextResponse } from "next/server";
import { getD1Client } from "@/lib/d1-client";

/**
 * ランキング項目取得API
 * GET /api/ranking-items/[subcategoryId]
 *
 * 指定されたサブカテゴリのランキング項目を取得する
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcategoryId: string }> }
) {
  try {
    const { subcategoryId } = await params;

    if (!subcategoryId) {
      return NextResponse.json(
        { error: "サブカテゴリIDが必要です" },
        { status: 400 }
      );
    }

    const db = getD1Client();

    // サブカテゴリ設定とランキング項目を取得
    const query = `
      SELECT 
        sc.id as subcategory_id,
        sc.category_id,
        sc.name as subcategory_name,
        sc.description,
        sc.default_ranking_key,
        ri.ranking_key,
        ri.label,
        ri.stats_data_id,
        ri.cd_cat01,
        ri.unit,
        ri.name as ranking_name,
        ri.display_order,
        ri.is_active
      FROM subcategory_configs sc
      LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id AND ri.is_active = 1
      WHERE sc.id = ?
      ORDER BY ri.display_order
    `;

    const result = await db.prepare(query).bind(subcategoryId).all();

    if (!result.success) {
      console.error("Database query failed:", result.error);
      return NextResponse.json(
        { error: "データベースクエリに失敗しました" },
        { status: 500 }
      );
    }

    const rows = result.results as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "指定されたサブカテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // データを整形
    const subcategoryConfig = {
      id: rows[0].subcategory_id,
      categoryId: rows[0].category_id,
      name: rows[0].subcategory_name,
      description: rows[0].subcategory_description,
      defaultRankingKey: rows[0].default_ranking_key,
    };

    const rankingItems = rows
      .filter((row) => row.ranking_key) // ランキング項目がある行のみ
      .map((row) => ({
        rankingKey: row.ranking_key,
        label: row.label,
        statsDataId: row.stats_data_id,
        cdCat01: row.cd_cat01,
        unit: row.unit,
        name: row.ranking_name,
        displayOrder: row.display_order,
        isActive: Boolean(row.is_active),
      }));

    const response = {
      subcategory: subcategoryConfig,
      rankingItems,
    };

    // キャッシュヘッダーを設定（5分間キャッシュ）
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
