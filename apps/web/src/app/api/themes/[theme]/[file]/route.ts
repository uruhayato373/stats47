/**
 * テーマ YoY データプロキシ。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、サーバー側で取得して同一オリジンで返す。
 *
 *   /api/themes/population-dynamics/yoy-total-population.json
 *     → app/themes/population-dynamics/yoy-total-population.json
 */
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
    return new Response("invalid path", { status: 400 });
  }

  const res = await fetch(`${R2_BASE}/${theme}/${file}`, {
    cache: "force-cache",
  });
  if (!res.ok) {
    return new Response("not found", { status: 404 });
  }

  return new Response(res.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
