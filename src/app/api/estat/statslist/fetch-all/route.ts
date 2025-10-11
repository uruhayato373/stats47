import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListManager, BulkFetchResult, StatsListParams } from "@/lib/estat-stats-list-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { params: Partial<StatsListParams> };
    const { params: baseParams } = body;

    // 必須パラメータチェック
    const appId = process.env.ESTAT_APP_ID;
    if (!appId) {
      throw new Error("e-STAT APP IDが設定されていません");
    }

    // パラメータの設定
    const params: Partial<StatsListParams> = {
      appId,
      lang: baseParams.lang || 'J',
      limit: parseInt(baseParams.limit) || 1000,
    };

    // オプションの設定
    const options = {
      limit: parseInt(baseParams.limit) || 100000,
      delayMs: parseInt(baseParams.delayMs) || 1000,
    };

    // Cloudflare D1データベースの取得（今後実装）
    // 現在はモックレスポンスを返す
    const mockResult: BulkFetchResult = {
      totalFetched: 15,
      successCount: 14,
      failureCount: 1,
      totalRecords: 13456,
      results: [
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 1000 },
        { params, success: true, recordCount: 456 },
        { params, success: false, recordCount: 0, error: "API制限に達しました" },
      ],
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Fetch-all error:", error);
    return NextResponse.json(
      {
        totalFetched: 0,
        successCount: 0,
        failureCount: 1,
        totalRecords: 0,
        results: [],
        error: error instanceof Error ? error.message : "全件取得に失敗しました"
      },
      { status: 500 }
    );
  }
}