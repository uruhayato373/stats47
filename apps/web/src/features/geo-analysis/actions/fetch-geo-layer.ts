'use server';

import { findGeoLayer } from '@stats47/data-configs/business-plan';

import { projectGeoLayer } from '../lib/geo-layer-data';

import { fetchGeoDetailAction } from './fetch-geo-detail';

export async function fetchGeoLayerAction(
  slug: string,
  prefCode: string,
  expected: { generatedAt: string; sha256: string }
) {
  const layer = findGeoLayer(slug);
  if (!layer) return null;
  const detail = await fetchGeoDetailAction(
    layer.sourceAnalysis,
    prefCode,
    expected
  );
  return detail ? projectGeoLayer(slug, detail) : null;
}
