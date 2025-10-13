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

    const result = await db
      .prepare(
        `SELECT ranking_key 
         FROM estat_metainfo 
         WHERE stats_data_id = ? 
         AND cat01 = ? 
         AND ranking_key IS NOT NULL 
         LIMIT 1`
      )
      .bind(statsDataId, categoryCode)
      .first();

    return NextResponse.json({
      ranking_key: result?.ranking_key || null,
    });
  } catch (error) {
    console.error("ranking_key 取得エラー:", error);
    return NextResponse.json(
      { error: "ranking_key の取得に失敗しました" },
      { status: 500 }
    );
  }
}
