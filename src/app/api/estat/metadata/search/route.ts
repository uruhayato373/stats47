import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const statsDataId = searchParams.get("statsDataId") || "";

    // サンプルデータ（実際の実装ではCloudflare D1から取得）
    const sampleData = [
      {
        id: "1",
        statsDataId: "0003448237",
        statName: "人口推計",
        title: "人口推計（令和5年10月1日現在）",
        category: "人口・世帯",
        itemName: "総人口",
        unit: "人",
        updatedAt: "2024-01-15",
      },
      {
        id: "2",
        statsDataId: "0003348237",
        statName: "世帯数調査",
        title: "世帯数調査（令和5年）",
        category: "人口・世帯",
        itemName: "一般世帯数",
        unit: "世帯",
        updatedAt: "2024-01-10",
      },
      {
        id: "3",
        statsDataId: "0003160000",
        statName: "県民経済計算",
        title: "県民経済計算（令和4年度）",
        category: "経済・産業",
        itemName: "県内総生産",
        unit: "百万円",
        updatedAt: "2024-01-05",
      },
    ];

    let results = sampleData;

    // フィルタリング（実際の実装ではCloudflare D1でクエリ実行）
    if (statsDataId) {
      results = results.filter((item) => item.statsDataId === statsDataId);
    } else if (category) {
      results = results.filter((item) => item.category === category);
    } else if (query) {
      results = results.filter(
        (item) =>
          item.statName.toLowerCase().includes(query.toLowerCase()) ||
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.itemName.toLowerCase().includes(query.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("検索エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "検索に失敗しました" },
      { status: 500 }
    );
  }
}
