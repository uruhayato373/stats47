import { NextRequest, NextResponse } from "next/server";
import { EstatRelationalCacheService } from "@/lib/estat/cache/EstatRelationalCacheService";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { EstatStatsDataResponse } from "@/types/models/estat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statsDataId, categoryCode, timeCode, rawData } = body;

    if (!statsDataId || !categoryCode || !rawData) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // EstatStatsDataResponseをFormattedEstatDataに変換
    const formattedData = EstatStatsDataService.formatStatsData(
      rawData as EstatStatsDataResponse
    );

    // timeCodeを取得（最初の年次を使用）
    const actualTimeCode =
      formattedData.years.length > 0
        ? formattedData.years[0].timeCode
        : timeCode || "latest";

    // FormattedValue[]を抽出
    const values = formattedData.values;

    await EstatRelationalCacheService.saveRankingData(
      statsDataId,
      categoryCode,
      actualTimeCode,
      values
    );

    return NextResponse.json({
      success: true,
      savedCount: values.length,
      timeCode: actualTimeCode,
    });
  } catch (error) {
    console.error("データ保存エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存に失敗しました" },
      { status: 500 }
    );
  }
}
