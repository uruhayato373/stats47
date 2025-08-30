import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // サンプルデータ（実際の実装ではCloudflare D1から取得）
    const sampleData = {
      totalCount: 150,
      statCount: 3,
      categories: [
        {
          category: "人口・世帯",
          count: 85,
          stats: [
            {
              id: "0003448237",
              name: "人口推計",
              title: "人口推計（令和5年10月1日現在）",
            },
            {
              id: "0003348237",
              name: "世帯数調査",
              title: "世帯数調査（令和5年）",
            },
          ],
        },
        {
          category: "経済・産業",
          count: 45,
          stats: [
            {
              id: "0003160000",
              name: "県民経済計算",
              title: "県民経済計算（令和4年度）",
            },
          ],
        },
        {
          category: "社会・生活",
          count: 20,
          stats: [],
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: sampleData,
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "統計情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
