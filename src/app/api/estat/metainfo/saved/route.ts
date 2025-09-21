import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat/metainfo/EstatMetaInfoService";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Cloudflare D1データベースに直接接続
    const db = await createD1Database() as any;
    const metaInfoService = new EstatMetaInfoService(db);

    const offset = (page - 1) * limit;

    let results;
    if (search) {
      results = await metaInfoService.searchMetaInfo(search, {
        searchType: "full",
        limit,
        offset,
      });
    } else {
      const statsList = await metaInfoService.getStatsList({
        limit,
        offset,
        orderBy: "last_updated"
      });
      results = {
        entries: statsList,
        totalCount: statsList.length,
      };
    }

    const items = results.entries.map((item: any) => ({
      id: item.stats_data_id,
      statsDataId: item.stats_data_id,
      title: item.title,
      statName: item.stat_name,
      govOrg: "統計庁", // D1データベースにgovOrgがない場合のデフォルト値
      surveyDate: item.last_updated,
      savedAt: item.last_updated,
    }));

    const response = {
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((results.totalCount || items.length) / limit),
        totalItems: results.totalCount || items.length,
        itemsPerPage: limit,
      },
      meta: {
        executedAt: new Date().toISOString(),
        searchQuery: search,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Saved metadata fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存済みデータの取得に失敗しました",
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
      { status: 500 }
    );
  }
}