/**
 * 交通網の変遷の地図データ (TopoJSON) を同一オリジンで返す。
 *
 * R2 (storage.stats47.jp) は CORS ヘッダを返さないので、ブラウザから直接 fetch できない
 * (2026-10-29 に本番 R2 の応答で Access-Control-Allow-Origin が無いことを確認。手元の開発用中継だけが付ける)。
 * 読めるのは台帳の路線網と、全国・地方・都道府県の 3 種類のファイルだけ。
 *
 *   /api/geo/history/railway/national.topojson
 *   /api/geo/history/railway/region/kanto.topojson
 *   /api/geo/history/railway/pref/28.topojson
 */
import { infraHistoryKey, isInfraNetworkKey } from '@stats47/gis/infra-history';
import { fetchFromR2 } from '@stats47/r2-storage/server';

import { NO_STORE_CACHE_HEADERS, PUBLIC_DATA_CACHE_HEADERS } from '@/lib/cache-policy';

export const revalidate = 86400;

const FILE_PATTERN = /^(?:national|region\/[a-z_]+|pref\/\d{2})\.topojson$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ network: string; file: string[] }> },
) {
  const { network, file } = await params;
  const path = file.join('/');
  if (!isInfraNetworkKey(network) || !FILE_PATTERN.test(path)) {
    return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }
  const body = await fetchFromR2(infraHistoryKey(network, path)).catch(() => null);
  if (!body) {
    return new Response('Data unavailable', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  }
  return new Response(new Uint8Array(body), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...PUBLIC_DATA_CACHE_HEADERS },
  });
}
