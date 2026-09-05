'use server';

import { isGeoCrossAnalysisSlug } from '../lib/geo-cross-analysis';
import { isTimestamp } from '../lib/geo-runtime-contract';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';

export async function fetchGeoDetailAction(
  slug: string,
  prefCode: string,
  expected: { generatedAt: string; sha256: string }
) {
  if (
    !isGeoCrossAnalysisSlug(slug) ||
    !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefCode) ||
    !expected ||
    !isTimestamp(expected.generatedAt) ||
    !/^[a-f0-9]{64}$/.test(expected.sha256)
  )
    return null;
  const bundle = await loadGeoAnalysisPrefBundle(slug, prefCode);
  const artifact = bundle?.manifest.stages
    .find((stage) => stage.id === 'population-mesh')
    ?.outputs.find((output) => output.areaCode === `${prefCode}000`);
  if (
    !bundle ||
    bundle.manifest.generatedAt !== expected.generatedAt ||
    artifact?.sha256 !== expected.sha256
  )
    return null;
  return bundle.detail;
}
