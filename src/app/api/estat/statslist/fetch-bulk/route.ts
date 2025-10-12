import { NextRequest, NextResponse } from "next/server";
import {
  BulkFetchResult,
  StatsListParams,
} from "@/lib/estat-stats-list-manager";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      paramsList: Array<Partial<StatsListParams>>;
      options?: Record<string, unknown>;
    };
    const { paramsList } = body;

    if (!Array.isArray(paramsList) || paramsList.length === 0) {
      return NextResponse.json(
        { error: "パラメータリストが必要です" },
        { status: 400 }
      );
    }

    // 必須パラメータチェック
    const appId = process.env.ESTAT_APP_ID;
    if (!appId) {
      throw new Error("e-STAT APP IDが設定されていません");
    }

    // 各パラメータにappIdを追加

    // バッチ処理オプション

    // Cloudflare D1データベースの取得（今後実装）
    // 現在はモックレスポンスを返す
    const mockResult: BulkFetchResult = {
      totalFetched: paramsList.length,
      successCount: Math.max(0, paramsList.length - 1),
      failureCount: Math.min(1, paramsList.length),
      totalRecords: paramsList.length * 850, // 平均850件と仮定
      results: paramsList.map(
        (params: Partial<StatsListParams>, index: number) => {
          const isLast = index === paramsList.length - 1;
          return {
            params,
            success: !isLast, // 最後のものだけ失敗させる
            recordCount: isLast ? 0 : Math.floor(Math.random() * 1000) + 500,
            error: isLast ? "API制限に達しました" : undefined,
          };
        }
      ),
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Fetch-bulk error:", error);
    return NextResponse.json(
      {
        totalFetched: 0,
        successCount: 0,
        failureCount: 1,
        totalRecords: 0,
        results: [],
        error:
          error instanceof Error ? error.message : "一括取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
