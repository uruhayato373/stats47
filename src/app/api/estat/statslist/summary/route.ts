import { NextResponse } from "next/server";
import { StatsListSummary } from "@/lib/estat-stats-list-manager";

export async function GET() {
  try {
    // Cloudflare D1データベースの取得（今後実装）
    // 現在はモックデータを返す
    const mockSummary: StatsListSummary = {
      totalTables: 15432,
      uniqueStats: 234,
      categories: [
        { code: "02", name: "人口・世帯", count: 3421 },
        { code: "03", name: "労働・賃金", count: 2876 },
        { code: "04", name: "家計", count: 2103 },
        { code: "05", name: "住宅・土地・建設", count: 1654 },
        { code: "06", name: "製造業", count: 1432 },
        { code: "07", name: "商業・サービス業", count: 1287 },
        { code: "08", name: "企業・家計・経済", count: 987 },
        { code: "09", name: "農林水産業", count: 876 },
        { code: "10", name: "運輸・観光", count: 543 },
        { code: "11", name: "情報通信・科学技術", count: 453 },
      ],
      governmentOrgs: [
        { code: "00200", name: "総務省", count: 4321 },
        { code: "00500", name: "厚生労働省", count: 3210 },
        { code: "00600", name: "農林水産省", count: 2109 },
        { code: "00700", name: "経済産業省", count: 1876 },
        { code: "00800", name: "国土交通省", count: 1654 },
        { code: "00100", name: "内閣府", count: 1234 },
        { code: "00300", name: "法務省", count: 567 },
        { code: "00400", name: "外務省", count: 234 },
        { code: "01000", name: "文部科学省", count: 198 },
        { code: "00900", name: "環境省", count: 29 },
      ],
      dateRange: {
        earliest: "1920-01-01",
        latest: "2024-12-31",
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(mockSummary);
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "サマリー取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
