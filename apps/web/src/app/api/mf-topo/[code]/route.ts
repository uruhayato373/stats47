/**
 * 移動フロー用 topojson プロキシ。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、ブラウザから直接
 * fetch できない。サーバー側で取得して同一オリジンで返す。
 *
 *   /api/mf-topo/prefecture → 県境 topojson
 *   /api/mf-topo/28         → 兵庫県の市区町村境界 topojson
 */
import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";

const R2_BASE = "https://storage.stats47.jp/gis/mlit/20240101";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const url =
    code === "prefecture"
      ? `${R2_BASE}/prefecture.topojson`
      : /^\d{2}$/.test(code)
        ? `${R2_BASE}/${code}/${code}_city_dc.topojson`
        : null;

  if (!url) {
    return new Response("invalid code", { status: 400, headers: NO_STORE_CACHE_HEADERS });
  }

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    return new Response("topojson not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }

  return new Response(res.body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...LONG_LIVED_DATA_CACHE_HEADERS,
    },
  });
}
