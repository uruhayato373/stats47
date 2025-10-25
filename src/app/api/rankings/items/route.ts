import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/features/auth/lib/auth";

import { getDataProvider } from "@/lib/database";

export async function POST(request: NextRequest) {
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
      rankingKey: string;
      label: string;
      statsDataId: string;
      cdCat01: string;
      unit: string;
      name: string;
      displayOrder?: number;
      isActive?: boolean;
    };

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

    const db = await getDataProvider();

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
