import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { requireAdmin } from "@/lib/auth/api-auth";

export async function PATCH(request: NextRequest) {
  // 管理者認証チェック
  const { error } = await requireAdmin(request);
  if (error) return error;

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

    const db = await createD1Database();

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
