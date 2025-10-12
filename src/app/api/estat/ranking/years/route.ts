import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statsDataId = searchParams.get("statsDataId");
  const cdCat01 = searchParams.get("cdCat01");

  if (!statsDataId || !cdCat01) {
    return NextResponse.json(
      { error: "statsDataId と cdCat01 が必要です" },
      { status: 400 }
    );
  }

  try {
    const years = await EstatStatsDataService.getAvailableYears(
      statsDataId,
      cdCat01
    );
    return NextResponse.json({ years });
  } catch (error) {
    console.error("年度一覧取得エラー:", error);
    return NextResponse.json(
      {
        error: "年度一覧の取得に失敗しました",
        details: {
          statsDataId,
          cdCat01,
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
        },
      },
      { status: 500 }
    );
  }
}
