import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { statsDataId } = await request.json() as { statsDataId?: string };

    if (!statsDataId) {
      return NextResponse.json(
        { error: "統計表IDが必要です" },
        { status: 400 }
      );
    }

    // 開発環境ではローカルのCloudflare Workerエンドポイントを呼び出す
    // http://localhost:8787 はCloudflare Workersのローカル開発サーバー
    const workerResponse = await fetch('http://localhost:8787/api/estat/metainfo/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statsDataId }),
    });

    if (!workerResponse.ok) {
      // Cloudflare Workerが起動していない場合は、モックデータで動作確認
      console.warn('Cloudflare Worker not available, using mock data');

      const mockResult = {
        success: true,
        message: `統計表ID ${statsDataId} のモックデータを保存しました（Cloudflare Worker未起動のため）`,
        details: {
          statsDataId,
          timestamp: new Date().toISOString(),
          environment: 'development-mock'
        }
      };

      return NextResponse.json(mockResult);
    }

    const result = await workerResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "メタ情報の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}