/**
 * Geo 分析の県別 detail を同一オリジンの GET で返す (Server Action の POST はキャッシュできないため)。
 *
 *   /api/geo/analysis/<analysisSlug>/<prefCode>?v=<manifest.generatedAt>&sha=<population-mesh の sha256>
 *
 * v と sha は表示中の manifest の値。URL が版を含むので長期キャッシュできる。
 * 照合 (入力の有限集合・版・SHA・保存則) は resolveGeoDetail に集約し、版が合わなければ 404 を no-store で返す。
 */
import { resolveGeoDetail } from '@/features/geo-analysis';

import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from '@/lib/cache-policy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ analysisSlug: string; prefCode: string }> }
) {
  const { analysisSlug, prefCode } = await params;
  const search = new URL(request.url).searchParams;
  const detail = await resolveGeoDetail(analysisSlug, prefCode, {
    generatedAt: search.get('v') ?? '',
    sha256: search.get('sha') ?? '',
  });
  if (!detail) return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  return Response.json(detail, { headers: LONG_LIVED_DATA_CACHE_HEADERS });
}
