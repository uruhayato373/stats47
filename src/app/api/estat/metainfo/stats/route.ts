import { NextRequest, NextResponse } from "next/server";
import { createLocalD1Database } from "@/lib/local-d1-client";

export async function GET(request: NextRequest) {
  try {
    // ローカルD1データベースに接続
    const db = await createLocalD1Database();

    // 直接SQLクエリで統計データ一覧を取得
    const result = await db
      .prepare(
        "SELECT stats_data_id, stat_name, title, item_count, updated_at as last_updated FROM estat_metainfo_unique ORDER BY updated_at DESC LIMIT 50"
      )
      .all();

    return NextResponse.json(result.results);
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
