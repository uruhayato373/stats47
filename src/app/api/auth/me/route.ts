import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    // トークン検証
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "トークンが無効です" },
        { status: 401 }
      );
    }

    const db = await createD1Database();

    // セッションが有効か確認
    const session = await db
      .prepare(
        "SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP"
      )
      .bind(payload.sessionId)
      .first();

    if (!session) {
      return NextResponse.json(
        { error: "セッションが無効です" },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const user = await db
      .prepare(
        "SELECT id, username, email, role, last_login FROM users WHERE id = ?"
      )
      .bind(payload.userId)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
