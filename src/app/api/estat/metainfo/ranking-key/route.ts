import { NextRequest, NextResponse } from "next/server";
import { createLocalD1Database } from "@/lib/local-d1-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsDataId = searchParams.get("statsDataId");
    const cat01 = searchParams.get("cat01");

    if (!statsDataId || !cat01) {
      return NextResponse.json(
        { error: "statsDataId と cat01 パラメータが必要です" },
        { status: 400 }
      );
    }

    const db = await createLocalD1Database();

    // ranking_keyを検索
    const result = await db
      .prepare(
        `
      SELECT ri.ranking_key
      FROM ranking_items ri
      JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id
      WHERE dsm.data_source_id = 'estat'
        AND json_extract(dsm.metadata, '$.stats_data_id') = ?
        AND json_extract(dsm.metadata, '$.cd_cat01') = ?
      LIMIT 1
    `
      )
      .bind(statsDataId, cat01)
      .first();

    const rankingKey = result?.ranking_key || null;

    return NextResponse.json({ rankingKey });
  } catch (error) {
    console.error("ranking_key検索エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "検索に失敗しました" },
      { status: 500 }
    );
  }
}
