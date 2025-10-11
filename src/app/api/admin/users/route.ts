import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const db = await createD1Database();

    // ユーザー一覧を取得
    const users = await db
      .prepare(
        `
        SELECT
          id, name, email, username, role, is_active,
          created_at, last_login
        FROM users
        ORDER BY created_at DESC
      `
      )
      .all();

    return NextResponse.json({ users: users.results }, { status: 200 });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
