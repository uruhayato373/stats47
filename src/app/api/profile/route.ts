import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDataProvider } from "@/lib/database";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { name, username, email } = (await request.json()) as {
      name: string;
      username: string;
      email: string;
    };

    // バリデーション
    if (!name || !username || !email) {
      return NextResponse.json(
        { error: "必須フィールドが入力されていません" },
        { status: 400 }
      );
    }

    const db = await getDataProvider();

    // ユーザーネームとメールアドレスの重複チェック（自分以外）
    const existingUser = await db
      .prepare(
        "SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?"
      )
      .bind(email, username, session.user.id)
      .first();

    if (existingUser) {
      return NextResponse.json(
        {
          error: "このメールアドレスまたはユーザーネームは既に使用されています",
        },
        { status: 409 }
      );
    }

    // ユーザー情報を更新
    await db
      .prepare(
        `
        UPDATE users 
        SET name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind(name, username, email, session.user.id)
      .run();

    return NextResponse.json(
      {
        message: "プロフィールが更新されました",
        user: {
          id: session.user.id,
          name,
          username,
          email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
