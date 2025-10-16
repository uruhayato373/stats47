import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoRepository } from "@/lib/estat-api/meta-info/repositories";
import { createD1Database } from "@/lib/database";
import {
  EstatMetaInfoFetcher,
  EstatMetaInfoBatchProcessor,
} from "@/lib/estat-api";

export async function POST(request: NextRequest) {
  try {
    const { statsDataId, batchMode, startId, endId } =
      (await request.json()) as {
        statsDataId?: string | string[];
        batchMode?: boolean;
        startId?: string;
        endId?: string;
      };

    if (!statsDataId && !batchMode) {
      return NextResponse.json(
        { error: "統計表IDが必要です" },
        { status: 400 }
      );
    }

    // Cloudflare D1データベースに直接接続
    const db = await createD1Database();
    const metaInfoRepository = new EstatMetaInfoRepository(
      db as unknown as D1Database
    );

    let result;

    if (batchMode && startId && endId) {
      // ID範囲を指定した一括処理
      const batchResult = await EstatMetaInfoBatchProcessor.processRange(
        startId,
        endId,
        { batchSize: 10, delayMs: 1000 }
      );

      // 成功したデータをデータベースに保存
      for (const item of batchResult.results) {
        if (item.success) {
          // TODO: 成功したデータをデータベースに保存
          // metaInfoRepository.saveTransformedData(transformedData);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
        details: batchResult,
      });
    } else if (Array.isArray(statsDataId)) {
      // 複数IDの一括処理
      const batchResult = await EstatMetaInfoBatchProcessor.processBulk(
        statsDataId,
        { batchSize: 10, delayMs: 1000 }
      );

      // 成功したデータをデータベースに保存
      for (const item of batchResult.results) {
        if (item.success) {
          // TODO: 成功したデータをデータベースに保存
          // metaInfoRepository.saveTransformedData(transformedData);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
        details: batchResult,
      });
    } else if (statsDataId) {
      // 単一IDの処理
      const transformedData = await EstatMetaInfoFetcher.fetchAndTransform(
        statsDataId
      );

      // TODO: データベースに保存
      // const result = await metaInfoRepository.saveTransformedData(transformedData);

      return NextResponse.json({
        success: true,
        message: `統計表ID ${statsDataId} を処理しました`,
        details: { entriesProcessed: transformedData.length },
      });
    } else {
      return NextResponse.json(
        { error: "統計表IDが必要です" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ API: メタ情報保存エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "メタ情報の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}
