import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // ローカルのCloudflare Workerエンドポイントを呼び出す
    const workerResponse = await fetch('http://localhost:8787/api/estat/metainfo/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!workerResponse.ok) {
      console.warn('Cloudflare Worker not available, returning empty array');
      return NextResponse.json([]);
    }

    const result = await workerResponse.json();

    // Workerのレスポンス形式に応じて調整
    if (result.success && result.data) {
      return NextResponse.json(result.data.statsList || []);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}