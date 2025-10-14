import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoRepository } from "@/lib/estat-d1";
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
    const metaInfoRepository = new EstatMetaInfoRepository(
      db as unknown as D1Database
    );

    let result;

    if (batchMode && startId && endId) {
      // TODO: 実装が必要 - EstatMetaInfoFormatter + EstatMetaInfoRepository の組み合わせ
      throw new Error("Not implemented yet");
      return NextResponse.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
        details: result,
      });
    } else if (Array.isArray(statsDataId)) {
      // TODO: 実装が必要 - EstatMetaInfoFormatter + EstatMetaInfoRepository の組み合わせ
      throw new Error("Not implemented yet");
      return NextResponse.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
        details: result,
      });
    } else if (statsDataId) {
      // TODO: 実装が必要 - EstatMetaInfoFormatter + EstatMetaInfoRepository の組み合わせ
      throw new Error("Not implemented yet");
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
