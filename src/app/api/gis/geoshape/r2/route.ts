/**
 * R2ストレージAPI Route
 * GeoshapeデータのR2ストレージ操作
 */

import { NextRequest, NextResponse } from "next/server";

// R2ストレージの設定（環境変数から取得）
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * R2ストレージからデータを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    // R2ストレージが設定されていない場合は404を返す
    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME
    ) {
      return NextResponse.json(
        { error: "R2 storage not configured" },
        { status: 404 }
      );
    }

    // R2ストレージからデータを取得
    const response = await fetch(
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
      {
        headers: {
          Authorization: `Bearer ${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Data not found" }, { status: 404 });
      }
      throw new Error(`R2 fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[R2 API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from R2 storage" },
      { status: 500 }
    );
  }
}

/**
 * R2ストレージにデータを保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      key?: string;
      data?: unknown;
      cacheMaxAge?: number;
    };
    const { key, data, cacheMaxAge } = body;

    if (!key || !data) {
      return NextResponse.json(
        { error: "Key and data are required" },
        { status: 400 }
      );
    }

    // R2ストレージが設定されていない場合はスキップ
    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME
    ) {
      console.log("[R2 API] R2 storage not configured, skipping save");
      return NextResponse.json({ success: true });
    }

    // R2ストレージにデータを保存
    const response = await fetch(
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`,
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${cacheMaxAge || 86400}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`R2 save failed: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[R2 API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save data to R2 storage" },
      { status: 500 }
    );
  }
}

/**
 * R2ストレージからデータを削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    // R2ストレージが設定されていない場合はスキップ
    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET_NAME
    ) {
      console.log("[R2 API] R2 storage not configured, skipping delete");
      return NextResponse.json({ success: true });
    }

    // R2ストレージからデータを削除
    const response = await fetch(
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 delete failed: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[R2 API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete data from R2 storage" },
      { status: 500 }
    );
  }
}
