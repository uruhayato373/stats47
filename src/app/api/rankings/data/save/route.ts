import { NextRequest, NextResponse } from "next/server";
// TODO: 実装が必要 - 新しい構造に合わせて修正
// import { EstatRelationalCacheService } from "@/infrastructure/estat/cache/EstatRelationalCacheService";
// import { EstatStatsDataFormatter } from "@/features/estat-api";
// import { EstatStatsDataResponse } from "@/features/estat-api";

interface SaveRequest {
  statsDataId: string;
  categoryCode: string;
  timeCode?: string;
  rawData: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveRequest;
    const { statsDataId, categoryCode, timeCode, rawData } = body;

    if (!statsDataId || !categoryCode || !rawData) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // TODO: 実装が必要 - 新しい構造に合わせて修正
    throw new Error(
      "Not implemented yet - needs refactoring for new structure"
    );

    return NextResponse.json({
      success: true,
      savedCount: 0,
      timeCode: timeCode || "unknown",
    });
  } catch (error) {
    console.error("データ保存エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存に失敗しました" },
      { status: 500 }
    );
  }
}
