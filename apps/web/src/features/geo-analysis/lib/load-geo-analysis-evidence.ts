import 'server-only';

import {
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  assertFloodArchiveKeys,
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisEvidenceManifest,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { parseGeoStationAccessPrefDetail } from './geo-station-access-evidence';

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
  const inputLayers = new Set(
    value.inputs
      .filter(isRecord)
      .filter(
        (input) =>
          input.role === 'calculation-input' && input.usedInCalculation === true
      )
      .map((input) => input.layerId)
  );
  const hasSpatialJoin = value.stages.some(
    (stage) =>
      isRecord(stage) &&
      stage.kind === 'spatial-operation' &&
      Array.isArray(stage.inputIds) &&
      stage.inputIds.length >= 2
  );
  if (inputLayers.size < 2 || !hasSpatialJoin) return null;
  if (expectedSlug === 'population-flood-risk') {
    const floodStage = value.stages.filter(isRecord).find(stage => stage.id === 'flood-maximum-polygons');
    if (!floodStage || !Array.isArray(floodStage.outputs)) return null;
    try {
      assertFloodArchiveKeys(value.inputs.filter(isRecord).filter(input => input.datasetId === 'A31b').map(input => input.key));
      assertFloodArchiveKeys(floodStage.outputs.filter(isRecord).map(output => output.key));
    } catch { return null; }
  }
  if (
    expectedSlug === 'population-land-price' &&
    !value.stages.some(
      (stage) =>
        isRecord(stage) &&
        stage.id === 'land-price-mesh-join' &&
        stage.kind === 'spatial-operation'
    )
  )
    return null;
  return value as unknown as GeoAnalysisEvidenceManifest;
}

export function parseGeoAnalysisPrefDetail(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug,
  expectedAreaCode: string
): GeoAnalysisPrefDetail | null {
  if (!/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(expectedAreaCode)) return null;
  if (expectedSlug === 'population-station-access') {
    return parseGeoStationAccessPrefDetail(value, expectedAreaCode.slice(0, 2));
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
          p
            .slice(1, 4)
            .every((n) => typeof n === 'number' && Number.isFinite(n)) &&
          (p[4] === null || (typeof p[4] === 'number' && Number.isFinite(p[4])))
      )
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

export async function loadGeoAnalysisPrefDetail(
  slug: GeoCrossAnalysisSlug,
  prefCode2: string
): Promise<GeoAnalysisPrefDetail | null> {
  const areaCode = `${prefCode2}000`;
  try {
    const value = await fetchFromR2AsJson<unknown>(
      geoAnalysisPrefKey(slug, prefCode2)
    );
    const detail = parseGeoAnalysisPrefDetail(value, slug, areaCode);
    if (slug === 'population-flood-risk') {
      const manifest = await loadGeoAnalysisManifest(slug);
      if (!manifest || detail?.generatedAt !== manifest.generatedAt) return null;
    }
    return detail;
  } catch {
    return null;
  }
}

export function geoAnalysisPublicDataUrl(key: string): string {
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'https://storage.stats47.jp';
  return `${base.replace(/\/+$/, '')}/${key}`;
}
