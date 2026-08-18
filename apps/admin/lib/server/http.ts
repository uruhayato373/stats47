import "server-only";

import { NextResponse } from "next/server";

/**
 * Route Handler 用の JSON レスポンスヘルパ。全レスポンスに Cache-Control: no-store を付ける
 * (ローカルツール・常に最新状態を返す)。CORS ヘッダは付けない (same-origin のみ)。
 * エラーは常に { error: string } (stack / env / credential / コマンド全文を返さない)。
 */
export function jsonResponse<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return jsonResponse({ error: message }, status);
}

/** request body を JSON パース。失敗時は { error } 相当を投げる。 */
export async function parseJsonBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid JSON body");
  }
}
