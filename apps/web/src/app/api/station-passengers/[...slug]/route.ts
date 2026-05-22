/**
 * 駅別乗降客数 snapshot プロキシ。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、ブラウザから直接
 * fetch できない。サーバー側で R2 から取得して同一オリジンで返す。
 *
 *   /api/station-passengers/index           → 47 県サマリ
 *   /api/station-passengers/22/stations     → 静岡県の駅+乗降客数
 *   /api/station-passengers/22/lines        → 静岡県の鉄道路線 GeoJSON
 */
import { fetchFromR2AsString } from "@stats47/r2-storage/server";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug.join("/");

  if (!/^[\w-]+(?:\/[\w-]+)*$/.test(path)) {
    return new Response("invalid path", { status: 400 });
  }

  const body = await fetchFromR2AsString(`app/station-passengers/${path}.json`);
  if (!body) {
    return new Response("not found", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
