import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/database";
import { auth } from "@/features/auth/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者認証チェック
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      label: string;
      displayOrder: number;
      isActive?: boolean;
    };

    const { label, displayOrder, isActive } = body;

    // バリデーション
    if (!label || typeof displayOrder !== "number") {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      );
    }

    const db = await getDataProvider();

    const query = `
      UPDATE ranking_items
      SET
        label = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await db
      .prepare(query)
      .bind(label, displayOrder, isActive ? 1 : 0, id)
      .run();

    if (!result.success) {
      throw new Error("更新に失敗しました");
    }

    // 更新後のデータを取得
    const updatedItem = await db
      .prepare("SELECT * FROM ranking_items WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({
      success: true,
      rankingItem: updatedItem,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者認証チェック
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const db = await getDataProvider();

    // ソフトデリート
    const query = `
      UPDATE ranking_items
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await db.prepare(query).bind(id).run();

    if (!result.success) {
      throw new Error("削除に失敗しました");
    }

    return NextResponse.json({
      success: true,
      message: "ランキング項目を無効化しました",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
