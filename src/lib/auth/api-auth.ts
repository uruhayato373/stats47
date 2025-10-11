import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { createD1Database } from "@/lib/d1-client";

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
      user: null,
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: "トークンが無効です" },
        { status: 401 }
      ),
      user: null,
    };
  }

  // セッションが有効か確認
  try {
    const db = await createD1Database();
    const session = await db
      .prepare(
        "SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP"
      )
      .bind(payload.sessionId)
      .first();

    if (!session) {
      return {
        error: NextResponse.json(
          { error: "セッションが無効です" },
          { status: 401 }
        ),
        user: null,
      };
    }
  } catch (error) {
    console.error("Session verification error:", error);
    return {
      error: NextResponse.json(
        { error: "セッション確認に失敗しました" },
        { status: 500 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user: payload,
  };
}

export async function requireAdmin(request: NextRequest) {
  const { error, user } = await requireAuth(request);

  if (error) {
    return { error, user: null };
  }

  if (user!.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { error: null, user };
}
