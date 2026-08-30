"use client";

/**
 * ブラウザから同一オリジンの /api/* を叩く最小 fetch wrapper。
 * SWR 等の外部データフェッチライブラリは使わない (依存最小・旧 UI の素の fetch を踏襲)。
 */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === "string" && value.length > 0) return value;
  }
  return `HTTP ${status}`;
}

/** GET リクエスト。JSON でないレスポンス / ネットワーク断も ApiError に正規化する。 */
export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path);
  } catch {
    throw new ApiError("サーバーに接続できません。npm run dev --workspace=apps/admin を起動してください", 0);
  }
  const body = await parseJson(res);
  if (!res.ok) throw new ApiError(errorMessage(body, res.status), res.status);
  return body as T;
}
