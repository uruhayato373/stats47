import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/database";
import { auth } from "@/lib/auth/auth";

export async function PATCH(request: NextRequest) {
  // 管理者認証チェック
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      subcategoryId: string;
      reorderedItems: Array<{
        id: string;
        displayOrder: number;
      }>;
    };
    const { subcategoryId, reorderedItems } = body;

    if (!subcategoryId || !Array.isArray(reorderedItems)) {
      return NextResponse.json(
        { error: "無効なリクエストデータです" },
        { status: 400 }
      );
    }

    const db = await getDataProvider();

    // トランザクションで一括更新
    const updatePromises = reorderedItems.map((item) => {
      const query = `
        UPDATE ranking_items
        SET display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND subcategory_id = ?
      `;
      return db
        .prepare(query)
        .bind(item.displayOrder, item.id, subcategoryId)
        .run();
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "表示順序を更新しました",
      updatedCount: reorderedItems.length,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
