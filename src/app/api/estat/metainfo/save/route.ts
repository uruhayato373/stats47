import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat/metainfo/EstatMetaInfoService";
import { createD1Database } from "@/lib/db";

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
    const metaInfoService = new EstatMetaInfoService(
      db as unknown as D1Database
    );

    let result;

    if (batchMode && startId && endId) {
      result = await metaInfoService.processMetaInfoRange(startId, endId);
      return NextResponse.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
        details: result,
      });
    } else if (Array.isArray(statsDataId)) {
      result = await metaInfoService.processBulkMetaInfo(statsDataId);
      return NextResponse.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
        details: result,
      });
    } else if (statsDataId) {
      result = await metaInfoService.processAndSaveMetaInfo(statsDataId);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `${statsDataId}のメタ情報を保存しました`
          : `${statsDataId}のメタ情報保存に失敗しました`,
        details: result,
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
