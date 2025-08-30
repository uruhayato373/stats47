import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statsDataId, batchMode, startId, endId } = body;

    // バリデーション
    if (!statsDataId && !batchMode) {
      return NextResponse.json(
        { error: "統計表IDまたはバッチモードが必要です" },
        { status: 400 }
      );
    }

    let message = "";

    if (batchMode && startId && endId) {
      // バッチ処理（実際の実装ではCloudflare D1に保存）
      message = `${startId}から${endId}までの統計表IDを処理しました`;
    } else if (Array.isArray(statsDataId)) {
      // 複数ID処理
      message = `${statsDataId.length}件の統計表IDを処理しました`;
    } else if (statsDataId) {
      // 単一ID処理
      message = `${statsDataId}のメタ情報を保存しました`;
    }

    return NextResponse.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "メタ情報の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}
