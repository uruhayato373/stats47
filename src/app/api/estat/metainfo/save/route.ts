import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat/metainfo/EstatMetaInfoService";
import { createD1Database } from "@/lib/d1-client";

export async function POST(request: NextRequest) {
  console.log("🔵 API: メタ情報保存開始");
  console.log("🔵 API: 環境変数確認:", {
    hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
    hasDatabaseId: !!process.env.CLOUDFLARE_D1_DATABASE_ID,
  });

  try {
    const { statsDataId, batchMode, startId, endId } =
      (await request.json()) as {
        statsDataId?: string | string[];
        batchMode?: boolean;
        startId?: string;
        endId?: string;
      };

    console.log("🔵 API: リクエストデータ受信:", { statsDataId, batchMode });

    if (!statsDataId && !batchMode) {
      console.log("❌ API: 統計表IDが不足");
      return NextResponse.json(
        { error: "統計表IDが必要です" },
        { status: 400 }
      );
    }

    // Cloudflare D1データベースに直接接続
    console.log("🔵 API: D1データベース接続開始");
    const db = await createD1Database();
    const metaInfoService = new EstatMetaInfoService(
      db as unknown as D1Database
    );
    console.log("✅ API: D1データベース接続完了");

    let result;

    if (batchMode && startId && endId) {
      console.log("🔵 API: バッチ処理開始");
      result = await metaInfoService.processMetaInfoRange(startId, endId);
      console.log("✅ API: バッチ処理完了");
      return NextResponse.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
        details: result,
      });
    } else if (Array.isArray(statsDataId)) {
      console.log("🔵 API: 複数ID処理開始");
      result = await metaInfoService.processBulkMetaInfo(statsDataId);
      console.log("✅ API: 複数ID処理完了");
      return NextResponse.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
        details: result,
      });
    } else if (statsDataId) {
      console.log("🔵 API: 単一ID処理開始:", statsDataId);
      result = await metaInfoService.processAndSaveMetaInfo(statsDataId);
      console.log("✅ API: 単一ID処理完了:", result);
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `${statsDataId}のメタ情報を保存しました`
          : `${statsDataId}のメタ情報保存に失敗しました`,
        details: result,
      });
    } else {
      console.log("❌ API: 統計表IDが不足（2回目）");
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
