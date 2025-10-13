import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createD1Database } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };
    const { username, email, password } = body;

    // バリデーション
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "必須フィールドが入力されていません" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上である必要があります" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // メールアドレスの重複チェック
    const existingUser = await db
      .prepare("SELECT * FROM users WHERE email = ? OR username = ?")
      .bind(email, username)
      .first();

    if (existingUser) {
      return NextResponse.json(
        {
          error: "このメールアドレスまたはユーザーネームは既に使用されています",
        },
        { status: 409 }
      );
    }

    // パスワードをハッシュ化
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // ユーザーを作成
    const userId = uuidv4();
    await db
      .prepare(
        `
        INSERT INTO users (
          id, name, email, username, password_hash, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(userId, username, email, username, password_hash, "user", 1)
      .run();

    return NextResponse.json(
      {
        message: "ユーザー登録が完了しました",
        user: {
          id: userId,
          username,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
