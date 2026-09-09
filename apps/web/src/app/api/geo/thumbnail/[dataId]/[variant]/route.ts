import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';

import {
  findGeoSourceThumbnail,
  geoThumbnailKey,
} from '@/features/geo-analysis';

/** Local image staging preview, following the blog-data development reader. */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ dataId: string; variant: string }>;
  }
) {
  if (process.env.NODE_ENV !== 'development')
    return new Response('Not found', { status: 404 });
  const { dataId, variant } = await params;
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  const config = findGeoSourceThumbnail(dataId, meta?.latestVersion);
  if (
    !config ||
    !meta ||
    (variant !== 'wide' && variant !== 'square') ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    return new Response('Not found', { status: 404 });
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  try {
    const bytes = await readFile(
      resolve(
        process.cwd(),
        '../../.local/image-staging/geo-thumbnails',
        geoThumbnailKey(dataId, config.version, variant)
      )
    );
    return new Response(new Uint8Array(bytes), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response('Preview unavailable', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
