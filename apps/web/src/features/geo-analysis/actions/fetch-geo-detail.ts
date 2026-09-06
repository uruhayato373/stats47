'use server';

import { isGeoCrossAnalysisSlug } from '../lib/geo-cross-analysis';
import { loadGeoAnalysisPrefDetail } from '../lib/load-geo-analysis-evidence';

export async function fetchGeoDetailAction(slug: string, prefCode: string) {
  if (
    !isGeoCrossAnalysisSlug(slug) ||
    !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefCode)
  )
    return null;
  return loadGeoAnalysisPrefDetail(slug, prefCode);
}
