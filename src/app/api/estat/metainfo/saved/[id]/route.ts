import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "IDが必要です" },
        { status: 400 }
      );
    }

    // Cloudflare D1データベースからの削除（今後実装）
    // 現在はモックレスポンスを返す
    const mockResult = {
      success: true,
      message: `メタ情報 (ID: ${id}) を削除しました`,
      deletedId: id,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Delete saved metadata error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "削除に失敗しました",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "IDが必要です" },
        { status: 400 }
      );
    }

    // Cloudflare D1データベースからの取得（今後実装）
    // 現在はモックデータを返す
    const mockItem = {
      id,
      statsDataId: "0003348423",
      title: "令和2年国勢調査 人口等基本集計",
      statName: "国勢調査",
      govOrg: "総務省",
      surveyDate: "2020-10-01",
      savedAt: "2024-01-15T10:30:00Z",
      rawData: JSON.stringify({
        // 実際の保存されたメタ情報データがここに入る
        mockData: true,
      }),
    };

    return NextResponse.json(mockItem);
  } catch (error) {
    console.error("Get saved metadata error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "データ取得に失敗しました",
      },
      { status: 500 }
    );
  }
}