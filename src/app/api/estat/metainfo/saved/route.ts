import { NextRequest, NextResponse } from "next/server";

interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
  rawData?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Cloudflare D1データベースからの取得（今後実装）
    // 現在はモックデータを返す
    const mockData: SavedMetadataItem[] = [
      {
        id: "1",
        statsDataId: "0003348423",
        title: "令和2年国勢調査 人口等基本集計",
        statName: "国勢調査",
        govOrg: "総務省",
        surveyDate: "2020-10-01",
        savedAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "2",
        statsDataId: "0003412345",
        title: "令和5年住宅・土地統計調査",
        statName: "住宅・土地統計調査",
        govOrg: "総務省",
        surveyDate: "2023-10-01",
        savedAt: "2024-01-14T15:20:00Z",
      },
      {
        id: "3",
        statsDataId: "0003456789",
        title: "令和4年経済センサス-活動調査",
        statName: "経済センサス",
        govOrg: "総務省",
        surveyDate: "2022-06-01",
        savedAt: "2024-01-13T09:15:00Z",
      },
      {
        id: "4",
        statsDataId: "0003567890",
        title: "令和3年社会生活基本調査",
        statName: "社会生活基本調査",
        govOrg: "総務省",
        surveyDate: "2021-10-20",
        savedAt: "2024-01-12T14:45:00Z",
      },
      {
        id: "5",
        statsDataId: "0003678901",
        title: "令和4年労働力調査年報",
        statName: "労働力調査",
        govOrg: "総務省",
        surveyDate: "2022-12-31",
        savedAt: "2024-01-11T11:30:00Z",
      },
      {
        id: "6",
        statsDataId: "0003789012",
        title: "令和4年家計調査年報",
        statName: "家計調査",
        govOrg: "総務省",
        surveyDate: "2022-12-31",
        savedAt: "2024-01-10T16:20:00Z",
      },
      {
        id: "7",
        statsDataId: "0003890123",
        title: "令和3年全国家計構造調査",
        statName: "全国家計構造調査",
        govOrg: "総務省",
        surveyDate: "2021-10-01",
        savedAt: "2024-01-09T13:10:00Z",
      },
      {
        id: "8",
        statsDataId: "0003901234",
        title: "令和4年個人企業経済調査",
        statName: "個人企業経済調査",
        govOrg: "総務省",
        surveyDate: "2022-12-31",
        savedAt: "2024-01-08T08:45:00Z",
      },
    ];

    // 検索フィルタリング
    const filteredData = search
      ? mockData.filter(item =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.statName.toLowerCase().includes(search.toLowerCase()) ||
          item.govOrg.toLowerCase().includes(search.toLowerCase())
        )
      : mockData;

    // ページネーション
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const response = {
      items: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
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