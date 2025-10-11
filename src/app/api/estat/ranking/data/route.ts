import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statsDataId = searchParams.get("statsDataId");
  const cdCat01 = searchParams.get("cdCat01");
  const yearCode = searchParams.get("yearCode");
  const limit = searchParams.get("limit");

  if (!statsDataId || !cdCat01 || !yearCode) {
    return NextResponse.json(
      { error: "statsDataId, cdCat01, yearCode が必要です" },
      { status: 400 }
    );
  }

  try {
    const data = await EstatStatsDataService.getPrefectureDataByYear(
      statsDataId,
      cdCat01,
      yearCode,
      limit ? parseInt(limit) : 100000
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("都道府県データ取得エラー:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
