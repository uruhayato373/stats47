import 'server-only';

import {
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisEvidenceManifest,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  isTimestamp,
  matchesGeoArtifact,
  validateGeoManifest,
} from './geo-runtime-contract';
import { parseGeoStationAccessPrefDetail } from './geo-station-access-evidence';

import type { GeoCrossAnalysisSlug } from './geo-cross-analysis';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseGeoAnalysisManifest(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug
): GeoAnalysisEvidenceManifest | null {
  return validateGeoManifest(value, expectedSlug);
}

export function parseGeoAnalysisPrefDetail(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug,
  expectedAreaCode: string
): GeoAnalysisPrefDetail | null {
  if (!/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(expectedAreaCode)) return null;
  if (!isRecord(value) || !isTimestamp(value.generatedAt)) return null;
  if (typeof value.areaName !== 'string' || value.areaName.trim().length === 0)
    return null;
  if (expectedSlug === 'population-station-access') {
    const detail = parseGeoStationAccessPrefDetail(
      value,
      expectedAreaCode.slice(0, 2)
    );
    if (
      !detail ||
      !Object.values(detail.summary).every(
        (n) => typeof n === 'number' && Number.isFinite(n)
      ) ||
      new Set(detail.stations.map((station) => station[0])).size !==
        detail.stations.length
    )
      return null;
    return detail;
  }
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.slug !== expectedSlug ||
    value.areaCode !== expectedAreaCode ||
    typeof value.areaName !== 'string' ||
    typeof value.generatedAt !== 'string' ||
    !Array.isArray(value.meshes) ||
    value.meshes.length === 0 ||
    value.meshes.length > 50_000 ||
    !isRecord(value.summary)
  ) {
    return null;
  }
  const meshWidth = expectedSlug === 'population-land-price' ? 7 : 8;
  const meshIds = new Set<string>();
  if (
    !value.meshes.every((mesh) => {
      if (
        !Array.isArray(mesh) ||
        mesh.length !== meshWidth ||
        typeof mesh[0] !== 'string' ||
        mesh[0].length === 0 ||
        meshIds.has(mesh[0]) ||
        !mesh.slice(1).every((n) => typeof n === 'number' && Number.isFinite(n))
      )
        return false;
      meshIds.add(mesh[0]);
      return (
        mesh[1] >= 122_000_000 &&
        mesh[3] <= 154_000_000 &&
        mesh[2] >= 20_000_000 &&
        mesh[4] <= 46_000_000 &&
        mesh[1] < mesh[3] &&
        mesh[2] < mesh[4] &&
        mesh[5] >= 0 &&
        mesh[6] >= 0
      );
    })
  )
    return null;
  if (
    expectedSlug === 'population-land-price' &&
    !Array.isArray(value.landPricePoints)
  ) {
    return null;
  }
  if (expectedSlug === 'population-land-price') {
    if (
      value.spatialMethod !== 'point-in-mesh' ||
      !Array.isArray(value.landPricePoints) ||
      !Array.isArray(value.pointMeshIds) ||
      value.pointMeshIds.length !== value.landPricePoints.length
    )
      return null;
    if (
      !value.landPricePoints.every(
        (p) =>
          Array.isArray(p) &&
          p.length === 5 &&
          typeof p[0] === 'string' &&
          p[0].length > 0 &&
          p
            .slice(1, 4)
            .every((n) => typeof n === 'number' && Number.isFinite(n)) &&
          p[1] >= 122_000_000 &&
          p[1] <= 154_000_000 &&
          p[2] >= 20_000_000 &&
          p[2] <= 46_000_000 &&
          p[3] >= 0 &&
          (p[4] === null || (typeof p[4] === 'number' && Number.isFinite(p[4])))
      )
    )
      return null;
    if (
      new Set(value.landPricePoints.map((point) => point[0])).size !==
      value.landPricePoints.length
    )
      return null;
    if (
      !value.pointMeshIds.every(
        (id) => id === null || (typeof id === 'string' && meshIds.has(id))
      )
    )
      return null;
  }
  if (
    Object.values(value.summary).some(
      (n) => n !== null && (typeof n !== 'number' || !Number.isFinite(n))
    )
  )
    return null;
  const detail = value as unknown as Exclude<
    GeoAnalysisPrefDetail,
    { slug: 'population-station-access' }
  >;
  const summary = value.summary;
  const input = {
    generatedAt: detail.generatedAt,
    areaCode: detail.areaCode,
    areaName: detail.areaName,
    meshes: detail.meshes.map((m) => ({
      meshId: m[0],
      areaCode: detail.areaCode,
      longitude: (m[1] + m[3]) / 2e6,
      latitude: (m[2] + m[4]) / 2e6,
      bounds: [m[1] / 1e6, m[2] / 1e6, m[3] / 1e6, m[4] / 1e6] as const,
      population2020: m[5],
      population2050: m[6],
      floodDepthClass: m[7] ?? 0,
    })),
  };
  try {
    const rebuilt =
      detail.slug === 'population-land-price'
        ? buildLandPricePrefDetail({
            ...input,
            points: detail.landPricePoints.map((p) => ({
              id: p[0],
              areaCode: detail.areaCode,
              longitude: p[1] / 1e6,
              latitude: p[2] / 1e6,
              price: p[3],
              change: p[4],
            })),
          })
        : buildFloodPrefDetail(input);
    if (
      Object.entries(rebuilt.summary).some(
        ([key, expected]) => summary[key] !== expected
      )
    )
      return null;
    if (
      detail.slug === 'population-land-price' &&
      rebuilt.slug === 'population-land-price' &&
      JSON.stringify(detail.pointMeshIds) !==
        JSON.stringify(rebuilt.pointMeshIds)
    )
      return null;
    if (
      detail.slug === 'population-flood-risk' &&
      (detail.meshMethod !== 'center-point' ||
        detail.meshes.some((m) => !Number.isInteger(m[7]) || m[7] < 0))
    )
      return null;
    return detail;
  } catch {
    return null;
  }
}

export async function loadGeoAnalysisManifest(
  slug: GeoCrossAnalysisSlug
): Promise<GeoAnalysisEvidenceManifest | null> {
  try {
    const value = await fetchFromR2AsJson<unknown>(
      geoAnalysisManifestKey(slug)
    );
    return parseGeoAnalysisManifest(value, slug);
  } catch {
    return null;
  }
}

export async function loadGeoAnalysisPrefBundle(
  slug: GeoCrossAnalysisSlug,
  prefCode2: string
): Promise<{
  detail: GeoAnalysisPrefDetail;
  manifest: GeoAnalysisEvidenceManifest;
} | null> {
  if (!/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefCode2)) return null;
  const areaCode = `${prefCode2}000`;
  try {
    const value = await fetchFromR2AsJson<unknown>(
      geoAnalysisPrefKey(slug, prefCode2)
    );
    const detail = parseGeoAnalysisPrefDetail(value, slug, areaCode);
    const manifest = await loadGeoAnalysisManifest(slug);
    if (!manifest || !detail || detail.generatedAt !== manifest.generatedAt)
      return null;
    const artifact = manifest.stages
      .find((stage) => stage.id === 'population-mesh')
      ?.outputs.find((output) => output.areaCode === areaCode);
    if (
      !artifact ||
      artifact.recordCount !== detail.meshes.length ||
      !(await matchesGeoArtifact(value, artifact))
    )
      return null;
    return { detail, manifest };
  } catch {
    return null;
  }
}

export async function loadGeoAnalysisPrefDetail(
  slug: GeoCrossAnalysisSlug,
  prefCode2: string
): Promise<GeoAnalysisPrefDetail | null> {
  return (await loadGeoAnalysisPrefBundle(slug, prefCode2))?.detail ?? null;
}

export function geoAnalysisPublicDataUrl(key: string): string {
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'https://storage.stats47.jp';
  return `${base.replace(/\/+$/, '')}/${key}`;
}
