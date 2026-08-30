import 'server-only';

import {
  GEO_STATION_ACCESS_MANIFEST_KEY,
  geoStationAccessPrefKey,
  type GeoAnalysisEvidenceManifest,
  type GeoStationAccessPrefDetail,
} from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  parseGeoAnalysisEvidenceManifest,
  parseGeoStationAccessPrefDetail,
} from './geo-station-access-evidence';

export async function loadGeoStationAccessPrefDetail(
  prefCode2: string
): Promise<GeoStationAccessPrefDetail | null> {
  if (!/^\d{2}$/.test(prefCode2)) return null;
  try {
    const value = await fetchFromR2AsJson<unknown>(
      geoStationAccessPrefKey(prefCode2)
    );
    return parseGeoStationAccessPrefDetail(value, prefCode2);
  } catch {
    return null;
  }
}

export async function loadGeoStationAccessManifest(): Promise<GeoAnalysisEvidenceManifest | null> {
  try {
    const value = await fetchFromR2AsJson<unknown>(
      GEO_STATION_ACCESS_MANIFEST_KEY
    );
    return parseGeoAnalysisEvidenceManifest(value);
  } catch {
    return null;
  }
}
