import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListManager } from "@/lib/estat-stats-list-manager";
import { StatsListParams } from "@/types/estat";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // URLパラメータをStatsListParamsに変換
    const params: Partial<StatsListParams> = {};

    // 必須パラメータ
    const appId = process.env.ESTAT_APP_ID;
    if (!appId) {
      throw new Error("e-STAT APP IDが設定されていません");
    }
    params.appId = appId;

    // オプションパラメータ
    const lang = searchParams.get('lang');
    if (lang) params.lang = lang as 'J' | 'E';

    const statsField = searchParams.get('statsField');
    if (statsField) params.statsField = statsField;

    const statsCode = searchParams.get('statsCode');
    if (statsCode) params.statsCode = statsCode;

    const surveyYears = searchParams.get('surveyYears');
    if (surveyYears) params.surveyYears = surveyYears;

    const openYears = searchParams.get('openYears');
    if (openYears) params.openYears = openYears;

    const searchWord = searchParams.get('searchWord');
    if (searchWord) params.searchWord = searchWord;

    const searchKind = searchParams.get('searchKind');
    if (searchKind) params.searchKind = searchKind as '1' | '2';

    const collectArea = searchParams.get('collectArea');
    if (collectArea) params.collectArea = collectArea as '1' | '2' | '3';

    const limit = searchParams.get('limit');
    if (limit) params.limit = parseInt(limit);

    const startPosition = searchParams.get('startPosition');
    if (startPosition) params.startPosition = parseInt(startPosition);

    // Cloudflare D1データベースの取得（今後実装）
    // 現在はモックレスポンスを返す
    const mockResult = {
      success: true,
      recordsProcessed: parseInt(limit || "100"),
      totalAvailable: 2500,
      message: "統計表リストを正常に取得しました（モックデータ）",
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        recordsProcessed: 0,
        totalAvailable: 0,
        error: error instanceof Error ? error.message : "データ取得に失敗しました"
      },
      { status: 500 }
    );
  }
}