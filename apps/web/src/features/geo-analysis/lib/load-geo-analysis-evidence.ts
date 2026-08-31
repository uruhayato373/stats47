import 'server-only';

import {
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisEvidenceManifest,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import type { GeoCrossAnalysisSlug } from './geo-cross-analysis';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseGeoAnalysisManifest(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug
): GeoAnalysisEvidenceManifest | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.slug !== expectedSlug ||
    typeof value.generatedAt !== 'string' ||
    typeof value.definitionSha256 !== 'string' ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.stages) ||
    !isRecord(value.aggregate) ||
    !isRecord(value.quality) ||
    value.quality.expectedAreas !== 47 ||
    value.quality.detailAreas !== 47 ||
    value.quality.conservationChecks !== 47
  ) {
    return null;
  }
  return value as unknown as GeoAnalysisEvidenceManifest;
}

export function parseGeoAnalysisPrefDetail(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug,
  expectedAreaCode: string
): GeoAnalysisPrefDetail | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.slug !== expectedSlug ||
    value.areaCode !== expectedAreaCode ||
    typeof value.areaName !== 'string' ||
    !Array.isArray(value.meshes) ||
    value.meshes.length === 0 ||
    !isRecord(value.summary)
  ) {
    return null;
  }
  if (
    expectedSlug === 'population-land-price' &&
    !Array.isArray(value.landPricePoints)
  ) {
    return null;
  }
  if (
    expectedSlug === 'population-station-access' &&
    !Array.isArray(value.stations)
  ) {
    return null;
  }
  return value as unknown as GeoAnalysisPrefDetail;
}

export async function loadGeoAnalysisManifest(
  slug: GeoCrossAnalysisSlug
): Promise<GeoAnalysisEvidenceManifest | null> {
  try {
    const value = await fetchFromR2AsJson<unknown>(geoAnalysisManifestKey(slug));
    return parseGeoAnalysisManifest(value, slug);
  } catch {
    return null;
  }
}

export async function loadGeoAnalysisPrefDetail(
  slug: GeoCrossAnalysisSlug,
  prefCode2: string
): Promise<GeoAnalysisPrefDetail | null> {
  const areaCode = `${prefCode2}000`;
  try {
    const value = await fetchFromR2AsJson<unknown>(
      geoAnalysisPrefKey(slug, prefCode2)
    );
    return parseGeoAnalysisPrefDetail(value, slug, areaCode);
  } catch {
    return null;
  }
}

export function geoAnalysisPublicDataUrl(key: string): string {
  return `https://storage.stats47.jp/${key}`;
}
