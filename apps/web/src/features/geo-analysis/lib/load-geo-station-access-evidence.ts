import 'server-only';

import {
  type GeoAnalysisEvidenceManifest,
  type GeoStationAccessPrefDetail,
} from '@stats47/gis';

import {
  loadGeoAnalysisManifest,
  loadGeoAnalysisPrefDetail,
} from './load-geo-analysis-evidence';

export async function loadGeoStationAccessPrefDetail(
  prefCode2: string
): Promise<GeoStationAccessPrefDetail | null> {
  const detail = await loadGeoAnalysisPrefDetail(
    'population-station-access',
    prefCode2
  );
  return detail?.slug === 'population-station-access' ? detail : null;
}

export async function loadGeoStationAccessManifest(): Promise<GeoAnalysisEvidenceManifest | null> {
  return loadGeoAnalysisManifest('population-station-access');
}
