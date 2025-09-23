import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

/**
 * 指定された統計表IDに紐づく項目名一覧を取得するAPIエンドポイント
 *
 * @description
 * e-Statのメタ情報データベースから、指定された統計表IDに含まれる
 * 全ての項目名（item_name）を重複なしで取得します。
 * 統計表の詳細情報やカテゴリ情報を表示する際に使用されます。
 *
 * @param request - Next.jsのリクエストオブジェクト
 * @param request.nextUrl.searchParams - クエリパラメータ
 * @param request.nextUrl.searchParams.statsDataId - 取得対象の統計表ID（必須）
 *
 * @returns Promise<NextResponse>
 *
 * @example
 * ```typescript
 * // リクエスト例
 * GET /api/estat/metainfo/items?statsDataId=0000010201
 *
 * // レスポンス例
 * {
 *   "statsDataId": "0000010201",
 *   "itemNames": ["総人口", "男性人口", "女性人口"],
 *   "totalItems": 3,
 *   "executedAt": "2024-01-01T00:00:00.000Z"
 * }
 * ```
 *
 * @throws {400} statsDataIdパラメータが未指定の場合
 * @throws {500} データベース接続エラーまたはクエリ実行エラー
 *
 * @since 1.0.0
 * @author stats47開発チーム
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから統計表IDを取得
    const searchParams = request.nextUrl.searchParams;
    const statsDataId = searchParams.get("statsDataId");

    // 統計表IDの存在チェック
    if (!statsDataId) {
      return NextResponse.json(
        { error: "statsDataId parameter is required" },
        { status: 400 }
      );
    }

    // D1データベースに接続
    const db = await createD1Database();

    // 項目名を重複なしで取得するSQLクエリ
    // NULLや空文字列は除外し、アルファベット順でソート
    const query = `
      SELECT DISTINCT item_name
      FROM estat_metainfo
      WHERE stats_data_id = ?
      AND item_name IS NOT NULL
      AND item_name != ''
      ORDER BY item_name
    `;

    // プリペアドステートメントでクエリを実行
    const stmt = db.prepare(query);
    const result = await stmt.bind(statsDataId).all();

    // 結果から項目名の配列を抽出
    const itemNames =
      result.results?.map((row: { item_name: string }) => row.item_name) || [];

    // レスポンスオブジェクトを構築
    const response = {
      statsDataId,
      itemNames,
      totalItems: itemNames.length,
      executedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    // エラーハンドリング：データベースエラーやその他の例外をキャッチ
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "項目名の取得に失敗しました",
        itemNames: [],
        totalItems: 0,
      },
      { status: 500 }
    );
  }
}
