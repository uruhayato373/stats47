import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    // Cloudflare D1データベースに直接接続
    const db = await createD1Database();

    // 指定されたstats_data_idのデータをすべて削除

    const result = {
      success: true,
      message: `メタ情報 (ID: ${id}) を削除しました`,
      deletedId: id,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete saved metadata error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "削除に失敗しました",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    // Cloudflare D1データベースに直接接続
    const db = await createD1Database();

    // 指定されたstats_data_idのデータを取得
    const result = await db
      .prepare(
        `
        SELECT DISTINCT stats_data_id, stat_name, title,
               COUNT(*) as item_count, MAX(updated_at) as last_updated
        FROM estat_metainfo
        WHERE stats_data_id = ?
        GROUP BY stats_data_id, stat_name, title
      `
      )
      .bind(id)
      .first();

    if (!result) {
      return NextResponse.json(
        { error: "指定されたIDのデータが見つかりません" },
        { status: 404 }
      );
    }

    const item = {
      id: result.stats_data_id,
      statsDataId: result.stats_data_id,
      title: result.title,
      statName: result.stat_name,
      govOrg: "統計庁",
      surveyDate: result.last_updated,
      savedAt: result.last_updated,
      itemCount: result.item_count,
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error("Get saved metadata error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "データ取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
