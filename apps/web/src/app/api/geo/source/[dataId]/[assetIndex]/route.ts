import { loadGeoSourceItem } from '@/features/geo-analysis';

import { NO_STORE_CACHE_HEADERS } from '@/lib/cache-policy';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataId: string; assetIndex: string }> }
) {
  const { dataId, assetIndex } = await params;
  if (!/^\d{1,6}$/.test(assetIndex))
    return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  const item = await loadGeoSourceItem(dataId);
  const asset = item?.assets[Number(assetIndex)];
  if (!asset || new URL(_request.url).searchParams.get('file') !== asset.key) return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  const base =
    process.env.R2_PUBLIC_FETCH_URL ??
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
    'https://storage.stats47.jp';
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/${asset.key}`, {
      signal: _request.signal,
    });
  } catch {
    return new Response('Data unavailable', { status: 502, headers: NO_STORE_CACHE_HEADERS });
  }
  if (!response.ok) return new Response('Data unavailable', { status: 502, headers: NO_STORE_CACHE_HEADERS });
  // Stream the stored object; do not inflate nationwide GIS into Worker server memory.
  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
