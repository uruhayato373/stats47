import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListManager } from "@/lib/estat-stats-list-manager";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // Cloudflare D1データベースの取得（今後実装）
    // 現在はモックデータを返す
    const mockData = {
      entries: [
        {
          stat_id: "0003348423",
          stat_code: "00200521",
          stat_name: "国勢調査",
          gov_org_code: "00200",
          gov_org_name: "総務省",
          statistics_name: "国勢調査",
          title: "令和2年国勢調査 人口等基本集計",
          title_no: "1",
          cycle: "5年",
          survey_date: "2020-10-01",
          open_date: "2021-06-25",
          small_area: "0",
          collect_area: "全国",
          main_category_code: "02",
          main_category_name: "人口・世帯",
          sub_category_code: "01",
          sub_category_name: "人口",
          overall_total_number: 1000000,
          updated_date: "2021-06-25",
        },
        {
          stat_id: "0003412345",
          stat_code: "00200522",
          stat_name: "住宅・土地統計調査",
          gov_org_code: "00200",
          gov_org_name: "総務省",
          statistics_name: "住宅・土地統計調査",
          title: "令和5年住宅・土地統計調査",
          title_no: "1",
          cycle: "5年",
          survey_date: "2023-10-01",
          open_date: "2024-04-30",
          small_area: "0",
          collect_area: "全国",
          main_category_code: "02",
          main_category_name: "人口・世帯",
          sub_category_code: "02",
          sub_category_name: "世帯",
          overall_total_number: 500000,
          updated_date: "2024-04-30",
        },
      ],
      totalCount: query.includes("人口") ? 150 : 50,
      searchParams: {
        searchWord: query,
        searchType: searchParams.get('searchType') || 'full',
      },
      executedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "検索に失敗しました" },
      { status: 500 }
    );
  }
}