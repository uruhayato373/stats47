'use server';

import { findGeoLayer } from '@stats47/data-configs/business-plan';

import { projectGeoLayer } from '../lib/geo-layer-data';
import { resolveGeoDetail } from '../lib/resolve-geo-detail';

export async function fetchGeoLayerAction(
  slug: string,
  prefCode: string,
  expected: { generatedAt: string; sha256: string }
) {
  const layer = findGeoLayer(slug);
  if (!layer) return null;
  const detail = await resolveGeoDetail(
    layer.sourceAnalysis,
    prefCode,
    expected
  );
  return detail ? projectGeoLayer(slug, detail) : null;
}
