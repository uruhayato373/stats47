/**
 * GeoShapeデータ自動キャッシュAPI
 *
 * 外部URLから取得したGeoShapeデータをR2ストレージに保存
 * バックグラウンドで非同期実行される
 */

import { NextRequest, NextResponse } from "next/server";

import type { R2SaveRequest, R2SaveResponse } from "@/lib/area/geoshape/types";

export async function POST(request: NextRequest) {
  try {
    const body: R2SaveRequest = await request.json();
    const { key, data, metadata } = body;

    // バリデーション
    if (!key || !data || !metadata) {
      return NextResponse.json(
        { error: "Missing required fields: key, data, metadata" },
        { status: 400 }
      );
    }

    // R2バケットに保存
    const result = await saveToR2Bucket(key, data, metadata);

    const response: R2SaveResponse = {
      success: true,
      key,
      size: result.size,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[AutoCache API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * R2バケットにデータを保存
 */
async function saveToR2Bucket(
  key: string,
  data: any,
  metadata: any
): Promise<{ size: number; metadata: any }> {
  // Cloudflare R2バケットへの保存
  // 実際の実装では、Cloudflare WorkersのR2バインディングを使用

  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;

  // メタデータにサイズ情報を追加
  const enhancedMetadata = {
    ...metadata,
    size,
    contentType: "application/json",
    lastModified: new Date().toISOString(),
  };

  // TODO: 実際のR2保存処理
  // 現在はモック実装
  console.log(`[R2 Save] Key: ${key}, Size: ${size} bytes`);

  // 実際の実装例:
  // await env.GEOSHAPE_BUCKET.put(key, jsonString, {
  //   httpMetadata: {
  //     contentType: "application/json",
  //     cacheControl: "public, max-age=31536000", // 1年キャッシュ
  //   },
  //   customMetadata: enhancedMetadata,
  // });

  return {
    size,
    metadata: enhancedMetadata,
  };
}
