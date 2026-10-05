'use server';
import { PREFECTURE_CODE_2DIGIT_RE, to5DigitPrefCode } from '@stats47/area';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  isRecord,
  isTimestamp,
  matchesGeoArtifact,
} from '../lib/geo-runtime-contract';
import { loadGeoAnalysisManifest } from '../lib/load-geo-analysis-evidence';

import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
export async function fetchGeoSnowSourceAction(
  pref: string,
  expected: { generatedAt: string; sha256: string }
): Promise<FeatureCollection<Polygon | MultiPolygon> | null> {
  if (
    typeof pref !== 'string' ||
    pref.length !== 2 ||
    !PREFECTURE_CODE_2DIGIT_RE.test(pref) ||
    !expected ||
    !isTimestamp(expected.generatedAt) ||
    typeof expected.sha256 !== 'string' ||
    expected.sha256.length !== 64 ||
    !/^[a-f0-9]{64}$/.test(expected.sha256)
  )
    return null;
  const manifest = await loadGeoAnalysisManifest('population-snow-designation');
  const artifact = manifest?.stages
    .find((s) => s.id === 'snow-designation-polygons')
    ?.outputs.find((o) => o.areaCode === to5DigitPrefCode(pref));
  if (
    !manifest ||
    !artifact ||
    manifest.generatedAt !== expected.generatedAt ||
    artifact.sha256 !== expected.sha256
  )
    return null;
  try {
    const value = await fetchFromR2AsJson<unknown>(artifact.key);
    if (
      !isRecord(value) ||
      value.slug !== 'population-snow-designation' ||
      value.areaCode !== to5DigitPrefCode(pref) ||
      value.generatedAt !== expected.generatedAt ||
      value.displayOnly !== true ||
      !Array.isArray(value.features) ||
      !(await matchesGeoArtifact(value, artifact))
    )
      return null;
    if (
      !value.features.every(
        (f) =>
          isRecord(f) &&
          f.type === 'Feature' &&
          isRecord(f.properties) &&
          [1, 2].includes(Number(f.properties.class)) &&
          isRecord(f.geometry) &&
          ['Polygon', 'MultiPolygon'].includes(String(f.geometry.type)) &&
          Array.isArray(f.geometry.coordinates)
      )
    )
      return null;
    return {
      type: 'FeatureCollection',
      features: value.features,
    } as FeatureCollection<Polygon | MultiPolygon>;
  } catch {
    return null;
  }
}
