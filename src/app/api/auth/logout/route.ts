import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (token) {
      // トークンを検証してセッションIDを取得
      const payload = await verifyToken(token);

      if (payload?.sessionId) {
        const db = await createD1Database();

        // セッションを削除
        await db
          .prepare("DELETE FROM sessions WHERE id = ?")
          .bind(payload.sessionId)
          .run();
      }
    }

    // Cookieを削除
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    });

    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "ログアウトに失敗しました" },
      { status: 500 }
    );
  }
}
