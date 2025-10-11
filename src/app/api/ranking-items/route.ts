import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { requireAdmin } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();

    const {
      subcategoryId,
      rankingKey,
      label,
      statsDataId,
      cdCat01,
      unit,
      name,
      displayOrder = 0,
      isActive = true,
    } = body;

    // バリデーション
    if (
      !subcategoryId ||
      !rankingKey ||
      !label ||
      !statsDataId ||
      !cdCat01 ||
      !unit ||
      !name
    ) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      );
    }

    // rankingKeyの形式チェック（英数字のみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(rankingKey)) {
      return NextResponse.json(
        {
          error:
            "ランキングキーは英数字、ハイフン、アンダースコアのみ使用できます",
        },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    const query = `
      INSERT INTO ranking_items (
        subcategory_id,
        ranking_key,
        label,
        stats_data_id,
        cd_cat01,
        unit,
        name,
        display_order,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db
      .prepare(query)
      .bind(
        subcategoryId,
        rankingKey,
        label,
        statsDataId,
        cdCat01,
        unit,
        name,
        displayOrder,
        isActive ? 1 : 0
      )
      .run();

    if (!result.success) {
      // 一意制約違反のチェック
      if (result.error?.includes("UNIQUE")) {
        return NextResponse.json(
          { error: "同じランキングキーが既に存在します" },
          { status: 409 }
        );
      }
      throw new Error("作成に失敗しました");
    }

    // 作成されたデータを取得
    const newItem = await db
      .prepare("SELECT * FROM ranking_items WHERE id = last_insert_rowid()")
      .first();

    return NextResponse.json(
      {
        success: true,
        rankingItem: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
