/**
 * ウィジェットデータ取得API
 * GET /api/dashboard/widgets/[widgetKey]/data
 */

import { getMockWidgetData } from "@/lib/dashboard/mock-data";
import { NextRequest, NextResponse } from "next/server";
// TODO: Phase 2 - 実際のデータソース統合時に使用
// import { DataSourceFactory } from "@/features/dashboard/data-sources/factory";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ widgetKey: string }>;
  }
) {
  try {
    const { widgetKey } = await params;
    const searchParams = request.nextUrl.searchParams;
    const areaCode = searchParams.get("areaCode") || "00000";
    const dataSourceType = searchParams.get("dataSourceType") || "mock";
    const dataSourceKey = searchParams.get("dataSourceKey") || widgetKey;

    // TODO: Phase 2 - データソース統合
    // const dataSource = DataSourceFactory.create(dataSourceType);
    // const data = await dataSource.fetchData(dataSourceKey, areaCode);

    // 現時点ではモックデータを返す
    const data = getMockWidgetData(widgetKey);

    if (!data) {
      return NextResponse.json(
        { error: "Widget data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { widgetKey, areaCode, data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("[Widget Data API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
