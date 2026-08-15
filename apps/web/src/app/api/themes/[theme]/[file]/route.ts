/**
 * テーマ YoY データプロキシ。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、サーバー側で取得して同一オリジンで返す。
 *
 *   /api/themes/population-dynamics/yoy-total-population.json
 *     → app/themes/population-dynamics/yoy-total-population.json
 */
import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";

const R2_BASE = "https://storage.stats47.jp/app/themes";

export const revalidate = 86400;

const VALID_FILE = /^yoy-[\w-]+\.json$/;
const VALID_THEME = /^[\w-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ theme: string; file: string }> },
) {
  const { theme, file } = await params;

  if (!VALID_THEME.test(theme) || !VALID_FILE.test(file)) {
    return new Response("invalid path", { status: 400, headers: NO_STORE_CACHE_HEADERS });
  }

  const res = await fetch(`${R2_BASE}/${theme}/${file}`, {
    cache: "force-cache",
  });
  if (!res.ok) {
    return new Response("not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }

  return new Response(res.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...LONG_LIVED_DATA_CACHE_HEADERS,
    },
  });
}
