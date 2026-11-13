/**
 * 豪雪指定区域の原典境界を同一オリジンの GET で返す (Server Action の POST はキャッシュできないため)。
 *
 *   /api/geo/analysis/population-snow-designation/<prefCode>/snow-source?v=<manifest.generatedAt>&sha=<snow-designation-polygons の sha256>
 *
 * 照合は resolveGeoSnowSource に集約し、版・SHA・形が合わなければ 404 を no-store で返す。
 */
import { resolveGeoSnowSource } from '@/features/geo-analysis';

import { LONG_LIVED_DATA_CACHE_HEADERS, NO_STORE_CACHE_HEADERS } from '@/lib/cache-policy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ analysisSlug: string; prefCode: string }> }
) {
  const { analysisSlug, prefCode } = await params;
  const search = new URL(request.url).searchParams;
  const source =
    analysisSlug === 'population-snow-designation'
      ? await resolveGeoSnowSource(prefCode, {
          generatedAt: search.get('v') ?? '',
          sha256: search.get('sha') ?? '',
        })
      : null;
  if (!source) return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  return Response.json(source, { headers: LONG_LIVED_DATA_CACHE_HEADERS });
}
