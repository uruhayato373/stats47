import type {
  GeoAnalysisEvidenceManifest,
  GeoStationAccessMeshCell,
  GeoStationAccessPrefDetail,
  GeoStationAccessStation,
} from '@stats47/gis';

export type GeoStationAccessView = 'population' | 'overlap' | 'audit';

export function isGeoStationAccessView(
  value: string | undefined
): value is GeoStationAccessView {
  return value === 'population' || value === 'overlap' || value === 'audit';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMeshCell(value: unknown): value is GeoStationAccessMeshCell {
  if (!Array.isArray(value) || value.length !== 8) return false;
  const [meshId, west, south, east, north, population2020, population2050, accessible] =
    value;
  return (
    typeof meshId === 'string' &&
    meshId.length > 0 &&
    [west, south, east, north, population2020, population2050].every(
      isFiniteNumber
    ) &&
    west >= 122_000_000 &&
    east <= 154_000_000 &&
    south >= 20_000_000 &&
    north <= 46_000_000 &&
    west < east &&
    south < north &&
    population2020 >= 0 &&
    population2050 >= 0 &&
    (accessible === 0 || accessible === 1)
  );
}

function isStation(value: unknown): value is GeoStationAccessStation {
  if (!Array.isArray(value) || value.length !== 4) return false;
  const [id, name, longitude, latitude] = value;
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    typeof name === 'string' &&
    name.length > 0 &&
    isFiniteNumber(longitude) &&
    isFiniteNumber(latitude) &&
    longitude >= 122_000_000 &&
    longitude <= 154_000_000 &&
    latitude >= 20_000_000 &&
    latitude <= 46_000_000
  );
}

function round1(value: number): number {
  return Number(value.toFixed(1));
}

export function parseGeoStationAccessPrefDetail(
  value: unknown,
  expectedPrefCode2: string
): GeoStationAccessPrefDetail | null {
  if (!/^\d{2}$/.test(expectedPrefCode2) || !isRecord(value)) return null;
  if (
    value.schemaVersion !== 1 ||
    value.slug !== 'population-station-access' ||
    value.areaCode !== `${expectedPrefCode2}000` ||
    typeof value.areaName !== 'string' ||
    typeof value.generatedAt !== 'string' ||
    value.accessRadiusMeters !== 800 ||
    value.meshMethod !== 'center-point' ||
    !Array.isArray(value.meshes) ||
    !Array.isArray(value.stations) ||
    !isRecord(value.summary) ||
    value.meshes.length === 0 ||
    value.meshes.length > 50_000
  ) {
    return null;
  }
  if (!value.meshes.every(isMeshCell) || !value.stations.every(isStation)) {
    return null;
  }
  const meshIds = new Set<string>();
  for (const mesh of value.meshes) {
    if (meshIds.has(mesh[0])) return null;
    meshIds.add(mesh[0]);
  }
  const accessible = value.meshes.filter((mesh) => mesh[7] === 1);
  const population2020 = value.meshes.reduce((sum, mesh) => sum + mesh[5], 0);
  const population2050 = value.meshes.reduce((sum, mesh) => sum + mesh[6], 0);
  const accessiblePopulation2020 = accessible.reduce(
    (sum, mesh) => sum + mesh[5],
    0
  );
  const accessiblePopulation2050 = accessible.reduce(
    (sum, mesh) => sum + mesh[6],
    0
  );
  const expectedSummary: Record<string, number> = {
    meshCount: value.meshes.length,
    accessibleMeshCount: accessible.length,
    displayedStationCount: value.stations.length,
    population2020,
    population2050,
    accessiblePopulation2020,
    accessiblePopulation2050,
    stationAccessShare2020:
      population2020 > 0
        ? round1((accessiblePopulation2020 / population2020) * 100)
        : 0,
    stationAccessShare2050:
      population2050 > 0
        ? round1((accessiblePopulation2050 / population2050) * 100)
        : 0,
  };
  const summary = value.summary as Record<string, unknown>;
  if (
    Object.entries(expectedSummary).some(
      ([key, expected]) => summary[key] !== expected
    )
  ) {
    return null;
  }
  return value as unknown as GeoStationAccessPrefDetail;
}

export function parseGeoAnalysisEvidenceManifest(
  value: unknown
): GeoAnalysisEvidenceManifest | null {
  if (!isRecord(value)) return null;
  if (
    value.schemaVersion !== 1 ||
    value.slug !== 'population-station-access' ||
    typeof value.generatedAt !== 'string' ||
    typeof value.definitionSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.definitionSha256) ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.stages) ||
    value.stages.length < 5 ||
    !isRecord(value.aggregate) ||
    !isRecord(value.quality) ||
    value.quality.expectedAreas !== 47 ||
    value.quality.detailAreas !== 47 ||
    value.quality.conservationChecks !== 47
  ) {
    return null;
  }
  const stageIds = new Set(
    value.stages
      .filter(isRecord)
      .map((stage) => stage.id)
      .filter((id): id is string => typeof id === 'string')
  );
  const requiredStageIds = [
    'population-mesh',
    'station-representative-points',
    'station-passenger-context',
    'station-access-800m',
    'prefecture-aggregate',
  ];
  if (requiredStageIds.some((id) => !stageIds.has(id))) return null;
  return value as unknown as GeoAnalysisEvidenceManifest;
}
