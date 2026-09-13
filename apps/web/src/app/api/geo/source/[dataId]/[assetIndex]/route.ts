import { getR2Client } from '@stats47/r2-storage/server';

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
  if (process.env.CLOUDFLARE_WORKERS === 'true') {
    try {
      const bucket = await getR2Client();
      const object = await bucket.get(asset.key);
      if (!object) return new Response('Data unavailable', { status: 502, headers: NO_STORE_CACHE_HEADERS });
      // Send stored bytes without HTTP decompression. The browser worker already
      // decodes gzip; nationwide GIS must not expand inside the application Worker.
      return new Response(object.body as unknown as ReadableStream, {
        headers: {
          ...NO_STORE_CACHE_HEADERS,
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(object.size),
          ETag: object.httpEtag,
        },
      });
    } catch {
      return new Response('Data unavailable', { status: 502, headers: NO_STORE_CACHE_HEADERS });
    }
  }
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
  // Local development uses the public mirror; production uses the raw binding above.
  return new Response(response.body, {
    headers: {
      ...NO_STORE_CACHE_HEADERS,
      'Content-Type': 'application/octet-stream',
    },
  });
}
