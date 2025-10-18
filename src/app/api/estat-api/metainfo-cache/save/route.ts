import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoR2Service } from "@/lib/estat-api/meta-info/EstatMetaInfoR2Service";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import {
  SaveMetaInfoCacheRequest,
  SaveMetaInfoCacheResponse,
} from "@/types/models/r2/estat-metainfo-cache";

/**
 * e-StatメタインフォメーションをR2に保存するAPIエンドポイント
 * POST /api/estat-api/metainfo-cache/save
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveMetaInfoCacheResponse>> {
  try {
    // リクエストボディのパース
    const body: SaveMetaInfoCacheRequest = await request.json();

    // バリデーション
    if (!body.statsDataId || !body.metaInfoResponse) {
      return NextResponse.json(
        {
          success: false,
          message: "必須パラメータが不足しています",
          error: "statsDataId, metaInfoResponse は必須です",
        },
        { status: 400 }
      );
    }

    // 環境変数からR2バケットを取得
    // @ts-expect-error - Cloudflare環境でのみ利用可能
    const env = process.env as unknown as { METAINFO_BUCKET: R2Bucket };

    if (!env.METAINFO_BUCKET) {
      return NextResponse.json(
        {
          success: false,
          message: "R2バケットが設定されていません",
          error: "環境変数METAINFO_BUCKETが見つかりません",
        },
        { status: 500 }
      );
    }

    // R2に保存
    const result = await EstatMetaInfoR2Service.saveMetaInfo(
      env,
      body.statsDataId,
      body.metaInfoResponse as EstatMetaInfoResponse
    );

    return NextResponse.json({
      success: true,
      message: `メタ情報を保存しました（${Math.round(result.size / 1024)}KB）`,
      data: {
        key: result.key,
        size: result.size,
        statsDataId: body.statsDataId,
      },
    });
  } catch (error) {
    console.error("R2メタ情報保存エラー:", error);

    return NextResponse.json(
      {
        success: false,
        message: "メタ情報の保存に失敗しました",
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
