import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat/metainfo/EstatMetaInfoService";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    // Cloudflare D1データベースに直接接続
    const db = await createD1Database();
    const metaInfoService = new EstatMetaInfoService(db as unknown as D1Database);

    // 統計データ一覧を取得
    const statsList = await metaInfoService.getStatsList({ limit: 100 });

    return NextResponse.json(statsList);

  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}