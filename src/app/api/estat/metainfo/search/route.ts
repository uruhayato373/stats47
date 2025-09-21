import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat/metainfo/EstatMetaInfoService";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const statsDataId = searchParams.get("statsDataId") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam) : 100;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Cloudflare D1データベースに直接接続
    const db = await createD1Database() as any;
    const metaInfoService = new EstatMetaInfoService(db);

    let results;

    if (statsDataId) {
      results = await metaInfoService.searchMetaInfo(statsDataId, {
        searchType: "stats_id",
        limit,
        offset,
      });
    } else if (category) {
      results = await metaInfoService.searchMetaInfo(category, {
        searchType: "category",
        limit,
        offset,
      });
    } else if (query) {
      results = await metaInfoService.searchMetaInfo(query, {
        searchType: "full",
        limit,
        offset,
      });
    } else {
      const statsList = await metaInfoService.getStatsList({ limit, offset });
      results = {
        entries: statsList,
        totalCount: statsList.length,
        searchQuery: "",
        executedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("検索エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "検索に失敗しました" },
      { status: 500 }
    );
  }
}