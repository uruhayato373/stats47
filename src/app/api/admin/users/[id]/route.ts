import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createD1Database } from "@/lib/d1-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const { is_active, role } = (await request.json()) as {
      is_active?: boolean;
      role?: string;
    };

    const db = await createD1Database();

    // 自分自身のアカウントを無効化しようとしている場合は拒否
    if (id === session.user.id && is_active === false) {
      return NextResponse.json(
        { error: "自分のアカウントを無効化することはできません" },
        { status: 400 }
      );
    }

    // ユーザーが存在するかチェック
    const user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザー情報を更新
    const updateFields = [];
    const updateValues = [];

    if (typeof is_active === "boolean") {
      updateFields.push("is_active = ?");
      updateValues.push(is_active ? 1 : 0);
    }

    if (role && ["admin", "user"].includes(role)) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "更新するフィールドが指定されていません" },
        { status: 400 }
      );
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(id);

    await db
      .prepare(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`)
      .bind(...updateValues)
      .run();

    return NextResponse.json(
      {
        message: "ユーザー情報が更新されました",
        user: {
          id,
          is_active:
            typeof is_active === "boolean" ? is_active : user.is_active,
          role: role || user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}
