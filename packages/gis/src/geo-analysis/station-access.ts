import {
  haversineKilometers,
  round,
  type PopulationMeshPoint,
} from "./geo-analysis-core";

import type {
  GeoAnalysisSnapshotRow,
  GeoStationAccessPrefDetail,
} from "./snapshot";

export const STATION_ACCESS_RADIUS_KM = 0.8;
const STATION_GRID_DEGREES = 0.02;
const DISTANCE_TOLERANCE_KM = 1e-9;

export interface StationAccessPoint {
  readonly id: string;
  readonly name: string;
  readonly longitude: number;
  readonly latitude: number;
}

function gridKey(longitude: number, latitude: number): string {
  return `${Math.floor(longitude / STATION_GRID_DEGREES)}:${Math.floor(latitude / STATION_GRID_DEGREES)}`;
}

function stationGrid(
  stations: readonly StationAccessPoint[],
): Map<string, StationAccessPoint[]> {
  const result = new Map<string, StationAccessPoint[]>();
  for (const station of stations) {
    const key = gridKey(station.longitude, station.latitude);
    result.set(key, [...(result.get(key) ?? []), station]);
  }
  return result;
}

function nearbyStations(
  mesh: PopulationMeshPoint,
  grid: ReadonlyMap<string, readonly StationAccessPoint[]>,
  radiusKm: number,
): StationAccessPoint[] {
  const longitudeBin = Math.floor(mesh.longitude / STATION_GRID_DEGREES);
  const latitudeBin = Math.floor(mesh.latitude / STATION_GRID_DEGREES);
  const neighborRadius = Math.ceil(radiusKm / (111 * STATION_GRID_DEGREES));
  const result: StationAccessPoint[] = [];
  for (let x = -neighborRadius; x <= neighborRadius; x += 1) {
    for (let y = -neighborRadius; y <= neighborRadius; y += 1) {
      const candidates = grid.get(`${longitudeBin + x}:${latitudeBin + y}`);
      if (!candidates) continue;
      for (const station of candidates) {
        if (
          haversineKilometers(
            [mesh.longitude, mesh.latitude],
            [station.longitude, station.latitude],
          ) <=
          radiusKm + DISTANCE_TOLERANCE_KM
        ) {
          result.push(station);
        }
      }
    }
  }
  return result;
}

/** 駅位置とメッシュ中心点の大円距離を使い、入力を変更せず判定結果を返す。 */
export function calculateStationAccessibility(
  meshes: readonly PopulationMeshPoint[],
  stations: readonly StationAccessPoint[],
  radiusKm = STATION_ACCESS_RADIUS_KM,
): PopulationMeshPoint[] {
  const grid = stationGrid(stations);

  return meshes.map((mesh) => {
    const isStationAccessible = nearbyStations(mesh, grid, radiusKm).length > 0;
    return { ...mesh, isStationAccessible };
  });
}

/** 指定メッシュの距離判定に実際に寄与する駅だけを重複なく返す。 */
export function stationsWithinRadiusOfMeshes(
  meshes: readonly PopulationMeshPoint[],
  stations: readonly StationAccessPoint[],
  radiusKm = STATION_ACCESS_RADIUS_KM,
): StationAccessPoint[] {
  const grid = stationGrid(stations);
  const selected = new Map<string, StationAccessPoint>();
  for (const mesh of meshes) {
    for (const station of nearbyStations(mesh, grid, radiusKm)) {
      selected.set(station.id, station);
    }
  }
  return [...selected.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** 中間artifactと47県aggregateが同じ人口・メッシュ数を表すことを検査する。 */
export function assertStationAccessConservation(
  detail: GeoStationAccessPrefDetail,
  aggregateRow: GeoAnalysisSnapshotRow,
): void {
  const accessibleMeshes = detail.meshes.filter((mesh) => mesh[7] === 1);
  const population2020 = detail.meshes.reduce((sum, mesh) => sum + mesh[5], 0);
  const population2050 = detail.meshes.reduce((sum, mesh) => sum + mesh[6], 0);
  const accessiblePopulation2020 = accessibleMeshes.reduce(
    (sum, mesh) => sum + mesh[5],
    0,
  );
  const accessiblePopulation2050 = accessibleMeshes.reduce(
    (sum, mesh) => sum + mesh[6],
    0,
  );
  const share2020 =
    population2020 > 0
      ? round((accessiblePopulation2020 / population2020) * 100, 1)
      : 0;
  const share2050 =
    population2050 > 0
      ? round((accessiblePopulation2050 / population2050) * 100, 1)
      : 0;

  const checks: ReadonlyArray<readonly [string, number, number]> = [
    ["meshCount", detail.summary.meshCount, detail.meshes.length],
    [
      "accessibleMeshCount",
      detail.summary.accessibleMeshCount,
      accessibleMeshes.length,
    ],
    ["population2020", detail.summary.population2020, population2020],
    ["population2050", detail.summary.population2050, population2050],
    [
      "accessiblePopulation2020",
      detail.summary.accessiblePopulation2020,
      accessiblePopulation2020,
    ],
    [
      "accessiblePopulation2050",
      detail.summary.accessiblePopulation2050,
      accessiblePopulation2050,
    ],
    ["stationAccessShare2020", detail.summary.stationAccessShare2020, share2020],
    ["stationAccessShare2050", detail.summary.stationAccessShare2050, share2050],
    [
      "aggregateAccessibleMeshCount",
      Number(aggregateRow.values.accessibleMeshCount),
      accessibleMeshes.length,
    ],
    [
      "aggregateAccessiblePopulation2050",
      Number(aggregateRow.values.accessiblePopulation2050),
      Math.round(accessiblePopulation2050),
    ],
    [
      "aggregateStationAccessShare2020",
      Number(aggregateRow.values.stationAccessShare2020),
      share2020,
    ],
    [
      "aggregateStationAccessShare2050",
      Number(aggregateRow.values.stationAccessShare2050),
      share2050,
    ],
  ];

  const failed = checks.find(([, actual, expected]) => actual !== expected);
  if (failed) {
    throw new Error(
      `${detail.areaCode}: ${failed[0]} conservation不一致 actual=${failed[1]} expected=${failed[2]}`,
    );
  }
}
