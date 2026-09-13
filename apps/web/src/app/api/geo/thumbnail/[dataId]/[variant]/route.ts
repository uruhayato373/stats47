import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';

import {
  findGeoSourceThumbnail,
  geoThumbnailKey,
} from '@/features/geo-analysis';

import { NO_STORE_CACHE_HEADERS } from '@/lib/cache-policy';
import { ogpImageUrl } from '@/lib/metadata/ogp-image';

/** Preview local work first; a fresh checkout reads the published R2 image. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataId: string; variant: string }> }
) {
  if (process.env.NODE_ENV !== 'development')
    return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  const { dataId, variant } = await params;
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  const config = findGeoSourceThumbnail(dataId, meta?.latestVersion);
  if (
    !config ||
    !meta ||
    (variant !== 'wide' && variant !== 'square') ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    return new Response('Not found', { status: 404, headers: NO_STORE_CACHE_HEADERS });
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const key = geoThumbnailKey(dataId, config.version, variant);
  try {
    const bytes = await readFile(
      resolve(process.cwd(), '../../.local/image-staging/geo-thumbnails', key)
    );
    return new Response(new Uint8Array(bytes), {
      headers: { 'Content-Type': 'image/webp', ...NO_STORE_CACHE_HEADERS },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new Response(null, {
        status: 307,
        headers: { Location: ogpImageUrl(key), ...NO_STORE_CACHE_HEADERS },
      });
    }
    return new Response('Preview unavailable', {
      status: 404,
      headers: { ...NO_STORE_CACHE_HEADERS },
    });
  }
}
