import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoR2Repository } from "@/lib/database/estat/repositories";
import { EstatMetaInfoR2S3Repository } from "@/lib/database/estat/repositories/metainfo-r2-s3-repository";
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

    // デバッグ用ログ
    console.log("R2保存デバッグ情報:", {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
      hasMetaInfoBucket: !!env.METAINFO_BUCKET,
      statsDataId: body.statsDataId,
    });

    // mock環境ではR2保存をスキップ
    if (process.env.NEXT_PUBLIC_ENV === "mock") {
      console.log("R2保存をスキップ: mock環境");
      return NextResponse.json({
        success: true,
        message: "mock環境ではR2保存を無効化しています",
        data: {
          key: `estat_metainfo/${body.statsDataId}/meta.json`,
          size: 0,
          statsDataId: body.statsDataId,
        },
      });
    }

    // development/staging/production環境ではR2に保存
    // wrangler.tomlで定義されたMETAINFO_BUCKETバインディングを使用
    // @ts-expect-error - Cloudflare環境でのみ利用可能
    const env = process.env as unknown as { METAINFO_BUCKET: R2Bucket };

    if (!env.METAINFO_BUCKET) {
      // ローカル開発環境でR2バケットがない場合、S3互換APIを試す
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_ENV === "development"
      ) {
        try {
          console.log("S3互換APIでR2保存を実行:", body.statsDataId);
          const result = await EstatMetaInfoR2S3Repository.save(
            body.statsDataId,
            body.metaInfoResponse as EstatMetaInfoResponse
          );

          console.log("R2保存完了 (S3互換API):", result);
          return NextResponse.json({
            success: true,
            message: `メタ情報を保存しました（S3互換API、${Math.round(
              result.size / 1024
            )}KB）`,
            data: {
              key: result.key,
              size: result.size,
              statsDataId: body.statsDataId,
            },
          });
        } catch (s3Error) {
          console.error("S3互換APIでの保存に失敗:", s3Error);
          return NextResponse.json({
            success: true,
            message:
              "ローカル開発環境ではR2保存をスキップしました（S3互換API設定が必要です）",
            data: {
              key: `estat_metainfo/${body.statsDataId}/meta.json`,
              size: 0,
              statsDataId: body.statsDataId,
            },
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "R2バケットが設定されていません",
          error: "環境変数METAINFO_BUCKETが見つかりません",
        },
        { status: 500 }
      );
    }

    // Cloudflare環境でR2に保存
    console.log("R2に保存を実行 (Cloudflare):", body.statsDataId);
    const result = await EstatMetaInfoR2Repository.save(
      env,
      body.statsDataId,
      body.metaInfoResponse as EstatMetaInfoResponse
    );

    console.log("R2保存完了 (Cloudflare):", result);
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
