import { NextRequest, NextResponse } from "next/server";
import { estatAPI } from "@/lib/estat-api";

/**
 * e-Statメタ情報取得APIエンドポイント
 * GET /api/estat-api/meta-info/[statsDataId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { statsDataId: string } }
) {
  try {
    const { statsDataId } = params;

    // バリデーション
    if (!statsDataId) {
      return NextResponse.json(
        {
          success: false,
          error: "統計表IDが指定されていません",
        },
        { status: 400 }
      );
    }

    // e-Stat APIからメタ情報を取得
    const metaInfo = await estatAPI.getMetaInfo({ statsDataId });

    return NextResponse.json({
      success: true,
      data: metaInfo,
    });
  } catch (error) {
    console.error("メタ情報取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "メタ情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
