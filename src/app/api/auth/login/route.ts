import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth/jwt";
import { v4 as uuidv4 } from "uuid";

const TOKEN_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
  EXPIRES_IN: "7d",
  COOKIE_NAME: "auth_token",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // バリデーション
    if (!username || !password) {
      return NextResponse.json(
        { error: "ユーザー名とパスワードは必須です" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // ユーザー検索
    const user = await db
      .prepare("SELECT * FROM users WHERE username = ? AND is_active = 1")
      .bind(username)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash as string
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // セッションID生成
    const sessionId = uuidv4();

    // JWTトークン生成
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: (user.role as "admin" | "user") || "user",
      sessionId,
    });

    // セッションをデータベースに保存
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await db
      .prepare(
        "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
      )
      .bind(sessionId, user.id, token, expiresAt.toISOString())
      .run();

    // last_loginを更新
    await db
      .prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(user.id)
      .run();

    // レスポンスの作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    });

    // httpOnly Cookieにトークンを設定
    response.cookies.set(TOKEN_CONFIG.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7日間（秒）
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    );
  }
}
