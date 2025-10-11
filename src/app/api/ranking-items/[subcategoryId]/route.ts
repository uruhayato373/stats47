import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { FALLBACK_CONFIGS } from "@/lib/ranking/fallback-configs";

/**
 * ランキング項目取得API
 * GET /api/ranking-items/[subcategoryId]
 *
 * 指定されたサブカテゴリのランキング項目を取得する
 * データベース接続に失敗した場合はフォールバック設定を使用
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

    // データベース接続を試行
    try {
      const db = await createD1Database();

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

      console.log("Database query result:", {
        success: result.success,
        resultsCount: result.results?.length || 0,
        subcategoryId,
      });

      if (!result.success) {
        console.error("Database query failed:", result.error);
        throw new Error("データベースクエリに失敗しました");
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
    } catch (dbError) {
      console.warn(
        "データベース接続に失敗、フォールバック設定を使用:",
        dbError
      );

      // フォールバック設定を使用
      const fallbackConfig = FALLBACK_CONFIGS[subcategoryId];

      if (!fallbackConfig) {
        return NextResponse.json(
          { error: "指定されたサブカテゴリが見つかりません" },
          { status: 404 }
        );
      }

      console.log("フォールバック設定を使用:", {
        subcategoryId,
        rankingItemsCount: fallbackConfig.rankingItems.length,
      });

      return NextResponse.json(fallbackConfig, {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        },
      });
    }
  } catch (error) {
    console.error("API Error:", error);

    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
