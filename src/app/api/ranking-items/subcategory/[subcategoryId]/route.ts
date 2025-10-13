import { NextResponse } from "next/server";
import { createRankingRepository } from "@/lib/ranking/ranking-repository";

/**
 * ランキング項目取得API
 * GET /api/ranking-items/subcategory/[subcategoryId]
 *
 * 指定されたサブカテゴリのランキング項目を取得する（可視化設定も含む）
 * データベース接続に失敗した場合はフォールバック設定を使用
 */
export async function GET(
  request: Request,
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
      const repository = await createRankingRepository();
      const config = await repository.getRankingItemsBySubcategory(
        subcategoryId
      );

      console.log("Database query result:", {
        success: !!config,
        resultsCount: config?.rankingItems.length || 0,
        subcategoryId,
      });

      if (!config) {
        return NextResponse.json(
          { error: "指定されたサブカテゴリが見つかりません" },
          { status: 404 }
        );
      }

      // キャッシュヘッダーを設定（5分間キャッシュ）
      return NextResponse.json(config, {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      });
    } catch (dbError) {
      console.error("データベース接続エラー:", dbError);
      return NextResponse.json(
        {
          error: "データベースに接続できません",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 503 }
      );
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
