import { NextRequest, NextResponse } from "next/server";

import { estatAPI } from "@/features/estat-api";
import { buildEnvironmentConfig } from "@/infrastructure/config";

import { getMockMetaInfo } from "@data/mock/estat-api/meta-info";

/**
 * e-Statメタ情報取得APIエンドポイント
 * GET /api/estat-api/meta-info/[statsDataId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ statsDataId: string }> }
) {
  try {
    const { statsDataId } = await params;

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

    // 環境設定を取得
    const config = buildEnvironmentConfig();
    console.log(`[${config.environment}] メタ情報取得リクエスト:`, statsDataId);

    let metaInfo;

    if (config.isMock) {
      // Mock環境: ローカルJSONファイルを使用
      console.log(
        `[${config.environment}] モックデータからメタ情報を取得中...`
      );
      metaInfo = getMockMetaInfo(statsDataId);

      if (!metaInfo) {
        console.error(
          `[${config.environment}] モックデータが見つかりません: ${statsDataId}`
        );
        return NextResponse.json(
          {
            success: false,
            error: `モックデータが見つかりません: ${statsDataId}`,
          },
          { status: 404 }
        );
      }
    } else {
      // Development/Staging/Production環境: e-Stat APIを使用
      console.log(`[${config.environment}] e-Stat APIからメタ情報を取得中...`);
      metaInfo = await estatAPI.getMetaInfo({ statsDataId });
    }

    console.log(`[${config.environment}] メタ情報取得成功:`, {
      statsDataId,
      hasData: !!metaInfo,
      dataKeys: metaInfo ? Object.keys(metaInfo) : null,
    });

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
