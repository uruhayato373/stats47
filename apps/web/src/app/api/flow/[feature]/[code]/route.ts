/**
 * フロー系 per-prefecture JSON プロキシ（R2 SSOT）。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、サーバー側で取得して同一オリジンで返す。
 *
 *   /api/flow/migration/13      → app/migration-flow/13.json
 *   /api/flow/commute/13        → app/commute-flow/13.json
 *   /api/flow/finance/13        → app/finance-flow/13.json
 *   /api/flow/migration-muni/13 → app/migration-flow/municipalities/13.json（粒子地図用）
 */
import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";

const R2_BASE = "https://storage.stats47.jp";

/** feature → R2 key（許可リスト） */
const KEY_BUILDERS: Record<string, (code: string) => string> = {
  migration: (c) => `app/migration-flow/${c}.json`,
  commute: (c) => `app/commute-flow/${c}.json`,
  finance: (c) => `app/finance-flow/${c}.json`,
  "migration-muni": (c) => `app/migration-flow/municipalities/${c}.json`,
};

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ feature: string; code: string }> },
) {
  const { feature, code } = await params;
  const build = KEY_BUILDERS[feature];
  if (!build || !/^\d{2}$/.test(code)) {
    return new Response("invalid feature/code", { status: 400, headers: NO_STORE_CACHE_HEADERS });
  }

  const res = await fetch(`${R2_BASE}/${build(code)}`, { cache: "force-cache" });
  if (!res.ok) {
    return new Response("flow data not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }

  return new Response(res.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...LONG_LIVED_DATA_CACHE_HEADERS,
    },
  });
}
