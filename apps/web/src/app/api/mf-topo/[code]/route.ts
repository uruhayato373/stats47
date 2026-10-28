/**
 * 移動フロー用 topojson プロキシ。
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないため、ブラウザから直接
 * fetch できない。サーバー側で取得して同一オリジンで返す。
 *
 *   /api/mf-topo/prefecture → 県境 topojson
 *   /api/mf-topo/28         → 兵庫県の市区町村境界 topojson
 *
 * 市区町村の境界は WardMode の merged (政令指定都市は市全体・東京の特別区は区ごと)。
 * 値 (app/migration-flow/municipalities/<県>.json) は市全体と行政区、特別区部と 23 区の両方を持つので、
 * 形と同じ単位の行が結び付く。自前の統合版 `_city_dc` は 23 区を特別区部 1 つにまとめていた
 * (MUNI-WARD-MODE-READERS-01)。
 */
import { fetchMunicipalityTopologyForWardMode } from "@stats47/gis/server";

import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";

import { R2_PUBLIC_BASE_URL } from "@/config/site";

const R2_BASE = `${R2_PUBLIC_BASE_URL}/gis/mlit/20240101`;

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (/^\d{2}$/.test(code)) {
    const topology = await fetchMunicipalityTopologyForWardMode(code, "merged").catch(() => null);
    if (!topology) {
      return new Response("topojson not found", { status: 404, headers: NO_STORE_CACHE_HEADERS });
    }
    return Response.json(topology, { headers: LONG_LIVED_DATA_CACHE_HEADERS });
  }

  if (code !== "prefecture") {
    return new Response("invalid code", { status: 400, headers: NO_STORE_CACHE_HEADERS });
  }

  const res = await fetch(`${R2_BASE}/prefecture.topojson`, { cache: "force-cache" });
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
