import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/database";
import { RankingItemDB } from "@/types/models/ranking";

/**
 * APIレスポンスの型定義
 */
interface RankingKeyResponse {
  ranking_key?: string | null;
  ranking_item: RankingItemDB | null;
}

/**
 * エラーレスポンスの型定義
 */
interface ErrorResponse {
  error: string;
}

/**
 * ranking_key と ranking_items 設定を取得するAPIエンドポイント
 *
 * 機能:
 * - stats_data_id と cat01 で estat_ranking_config ビューからデータを取得
 * - ranking_items テーブルに対応するレコードがある場合は設定情報も返す
 * - ない場合は ranking_key のみ返す
 *
 * レスポンス形式:
 * - ranking_item が存在する場合: { ranking_item: { ranking_key, name, ... } }
 * - ranking_item が存在しない場合: { ranking_key: string, ranking_item: null }
 */
export async function GET(request: NextRequest) {
  try {
    // ===== 1. リクエストパラメータの取得とバリデーション =====
    const { searchParams } = new URL(request.url);
    const statsDataId = searchParams.get("statsDataId");
    const categoryCode = searchParams.get("categoryCode");

    // 必須パラメータのチェック
    if (!statsDataId || !categoryCode) {
      const errorResponse: ErrorResponse = {
        error: "statsDataId と categoryCode が必要です",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ===== 2. データベース接続 =====
    const db = await createD1Database();

    // ===== 3. estat_ranking_config ビューからデータ取得 =====
    // このビューは estat_metainfo と ranking_items を LEFT JOIN したもの
    // stats_data_id + cat01 で ranking_key を特定し、対応する ranking_items の設定も取得
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

    // ===== 4. データが存在しない場合の処理 =====
    if (!result) {
      const response: RankingKeyResponse = {
        ranking_key: null,
        ranking_item: null,
      };
      return NextResponse.json(response);
    }

    // ===== 5. レスポンスデータの構築 =====
    const response: RankingKeyResponse = {
      // ranking_item が存在する場合は ranking_key を省略（簡素化）
      // 存在しない場合は ranking_key のみ返す
      ...(result.ranking_item_id ? {} : { ranking_key: result.ranking_key }),

      // ranking_items の設定情報（存在する場合のみ）
      ranking_item: result.ranking_item_id
        ? {
            id: result.ranking_item_id,
            ranking_key: result.ranking_key, // ranking_item 内に ranking_key を含める
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
    };

    return NextResponse.json(response);
  } catch (error) {
    // ===== 6. エラーハンドリング =====
    console.error("ranking_config 取得エラー:", error);
    const errorResponse: ErrorResponse = {
      error: "ranking_config の取得に失敗しました",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
