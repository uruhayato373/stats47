import { median, round, type PopulationMeshPoint } from './geo-analysis-core';

import type {
  GeoAnalysisSnapshotRow,
  GeoFloodMeshCell,
  GeoFloodPrefDetail,
  GeoLandPricePoint,
  GeoLandPricePrefDetail,
  GeoPopulationMeshCell,
} from './snapshot';

export interface LandPriceDetailPointInput {
  readonly id: string;
  readonly areaCode: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly price: number;
  readonly change: number | null;
}

function quantizeCoordinate(value: number): number {
  return Math.round(value * 1_000_000);
}

function requireBounds(
  mesh: PopulationMeshPoint
): readonly [number, number, number, number] {
  if (!mesh.bounds) {
    throw new Error(`${mesh.areaCode}: mesh bounds欠落 ${mesh.meshId}`);
  }
  return mesh.bounds;
}

function populationMeshCell(mesh: PopulationMeshPoint): GeoPopulationMeshCell {
  const bounds = requireBounds(mesh);
  return [
    mesh.meshId,
    quantizeCoordinate(bounds[0]),
    quantizeCoordinate(bounds[1]),
    quantizeCoordinate(bounds[2]),
    quantizeCoordinate(bounds[3]),
    mesh.population2020,
    mesh.population2050,
  ];
}

function populationChangeRate(population2020: number, population2050: number): number {
  return population2020 > 0
    ? round(((population2050 - population2020) / population2020) * 100, 2)
    : 0;
}

/** 配信用座標精度で半開区間[西,東)×[南,北)を使い、境界点を一意に接続する。 */
export function joinLandPricePointsToMeshes(
  meshes: readonly GeoPopulationMeshCell[],
  points: readonly GeoLandPricePoint[]
): (string | null)[] {
  const bucketSize = 100_000; // E6座標で0.1度。候補を絞り、最終判定は境界で行う。
  const buckets = new Map<string, GeoPopulationMeshCell[]>();
  for (const mesh of meshes) {
    for (let x = Math.floor(mesh[1] / bucketSize); x <= Math.floor(mesh[3] / bucketSize); x++) {
      for (let y = Math.floor(mesh[2] / bucketSize); y <= Math.floor(mesh[4] / bucketSize); y++) {
        const key = `${x}:${y}`;
        const bucket = buckets.get(key) ?? [];
        bucket.push(mesh);
        buckets.set(key, bucket);
      }
    }
  }
  return points.map((point) => {
    const candidates = buckets.get(`${Math.floor(point[1] / bucketSize)}:${Math.floor(point[2] / bucketSize)}`) ?? [];
    const matches = candidates.filter((mesh) =>
      point[1] >= mesh[1] && point[1] < mesh[3] && point[2] >= mesh[2] && point[2] < mesh[4]
    );
    if (matches.length > 1) throw new Error(`${point[0]}: 人口メッシュが重複して包含`);
    return matches[0]?.[0] ?? null;
  });
}

export function summarizeLandPriceJoin(
  meshes: readonly GeoPopulationMeshCell[],
  points: readonly GeoLandPricePoint[],
  pointMeshIds: readonly (string | null)[]
) {
  const byId = new Map(meshes.map((mesh) => [mesh[0], mesh]));
  let matchedPointCount = 0;
  let comparablePointCount = 0;
  let risingDecliningPointCount = 0;
  points.forEach((point, index) => {
    const meshId = pointMeshIds[index];
    const mesh = meshId ? byId.get(meshId) : undefined;
    if (!mesh) return;
    matchedPointCount++;
    if (point[4] === null || mesh[5] <= 0) return;
    comparablePointCount++;
    if (point[4] > 0 && mesh[6] < mesh[5]) risingDecliningPointCount++;
  });
  return {
    matchedPointCount,
    unmatchedPointCount: points.length - matchedPointCount,
    comparablePointCount,
    risingDecliningPointCount,
    risingDecliningPointShare: comparablePointCount > 0
      ? round(risingDecliningPointCount / comparablePointCount * 100, 1) : null,
  };
}

export function buildLandPricePrefDetail(input: {
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly meshes: readonly PopulationMeshPoint[];
  readonly points: readonly LandPriceDetailPointInput[];
}): GeoLandPricePrefDetail {
  const areaMeshes = input.meshes.filter((mesh) => mesh.areaCode === input.areaCode);
  const areaPoints = input.points.filter((point) => point.areaCode === input.areaCode);
  if (areaMeshes.length === 0 || areaPoints.length === 0) {
    throw new Error(`${input.areaCode}: 地価分析の入力が不足しています`);
  }
  const meshes = areaMeshes.map(populationMeshCell);
  const landPricePoints: GeoLandPricePoint[] = areaPoints.map((point) => [
    point.id,
    quantizeCoordinate(point.longitude),
    quantizeCoordinate(point.latitude),
    point.price,
    point.change,
  ]);
  const population2020 = meshes.reduce((sum, mesh) => sum + mesh[5], 0);
  const population2050 = meshes.reduce((sum, mesh) => sum + mesh[6], 0);
  const pointMeshIds = joinLandPricePointsToMeshes(meshes, landPricePoints);
  return {
    schemaVersion: 1,
    slug: 'population-land-price',
    generatedAt: input.generatedAt,
    areaCode: input.areaCode,
    areaName: input.areaName,
    meshes,
    landPricePoints,
    pointMeshIds,
    spatialMethod: 'point-in-mesh',
    summary: {
      ...summarizeLandPriceJoin(meshes, landPricePoints, pointMeshIds),
      meshCount: meshes.length,
      pointCount: landPricePoints.length,
      population2020,
      population2050,
      medianResidentialLandPrice: round(median(areaPoints.map((point) => point.price)), 0),
      medianLandPriceChange: round(
        median(
          areaPoints
            .map((point) => point.change)
            .filter((value): value is number => value !== null)
        ),
        1
      ),
      populationChangeRate: populationChangeRate(population2020, population2050),
    },
  };
}

export function assertLandPriceConservation(
  detail: GeoLandPricePrefDetail,
  aggregate: GeoAnalysisSnapshotRow
): void {
  const expectedIds = joinLandPricePointsToMeshes(detail.meshes, detail.landPricePoints);
  if (detail.spatialMethod !== 'point-in-mesh' ||
      JSON.stringify(expectedIds) !== JSON.stringify(detail.pointMeshIds)) {
    throw new Error(`${detail.areaCode}: 地価地点の空間結合不一致`);
  }
  const joined = summarizeLandPriceJoin(detail.meshes, detail.landPricePoints, expectedIds);
  for (const key of Object.keys(joined) as (keyof typeof joined)[]) {
    if (detail.summary[key] !== joined[key] || aggregate.values[key] !== joined[key]) {
      throw new Error(`${detail.areaCode}: ${key} conservation不一致`);
    }
  }
  const checks: ReadonlyArray<readonly [string, number, number]> = [
    ['sampleCount', Number(aggregate.values.sampleCount), detail.summary.pointCount],
    [
      'medianResidentialLandPrice',
      Number(aggregate.values.medianResidentialLandPrice),
      detail.summary.medianResidentialLandPrice,
    ],
    [
      'medianLandPriceChange',
      Number(aggregate.values.medianLandPriceChange),
      detail.summary.medianLandPriceChange,
    ],
    ['population2050', Number(aggregate.values.population2050), Math.round(detail.summary.population2050)],
    [
      'populationChangeRate',
      Number(aggregate.values.populationChangeRate),
      detail.summary.populationChangeRate,
    ],
  ];
  const failed = checks.find(([, actual, expected]) => actual !== expected);
  if (failed) {
    throw new Error(
      `${detail.areaCode}: ${failed[0]} conservation不一致 actual=${failed[1]} expected=${failed[2]}`
    );
  }
}

export function buildFloodPrefDetail(input: {
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly meshes: readonly PopulationMeshPoint[];
}): GeoFloodPrefDetail {
  const areaMeshes = input.meshes.filter((mesh) => mesh.areaCode === input.areaCode);
  if (areaMeshes.length === 0) {
    throw new Error(`${input.areaCode}: 洪水分析の人口メッシュがありません`);
  }
  const meshes: GeoFloodMeshCell[] = areaMeshes.map((mesh) => {
    const bounds = requireBounds(mesh);
    return [
      mesh.meshId,
      quantizeCoordinate(bounds[0]),
      quantizeCoordinate(bounds[1]),
      quantizeCoordinate(bounds[2]),
      quantizeCoordinate(bounds[3]),
      mesh.population2020,
      mesh.population2050,
      mesh.floodDepthClass ?? 0,
    ];
  });
  const exposed = meshes.filter((mesh) => mesh[7] > 0);
  const population2020 = meshes.reduce((sum, mesh) => sum + mesh[5], 0);
  const population2050 = meshes.reduce((sum, mesh) => sum + mesh[6], 0);
  const exposedPopulation2020 = exposed.reduce((sum, mesh) => sum + mesh[5], 0);
  const exposedPopulation2050 = exposed.reduce((sum, mesh) => sum + mesh[6], 0);
  return {
    schemaVersion: 1,
    slug: 'population-flood-risk',
    generatedAt: input.generatedAt,
    areaCode: input.areaCode,
    areaName: input.areaName,
    meshMethod: 'center-point',
    meshes,
    summary: {
      meshCount: meshes.length,
      exposedMeshCount: exposed.length,
      population2020,
      population2050,
      exposedPopulation2020,
      exposedPopulation2050,
      floodExposureShare2020:
        population2020 > 0
          ? round((exposedPopulation2020 / population2020) * 100, 1)
          : 0,
      floodExposureShare2050:
        population2050 > 0
          ? round((exposedPopulation2050 / population2050) * 100, 1)
          : 0,
    },
  };
}

export function assertFloodConservation(
  detail: GeoFloodPrefDetail,
  aggregate: GeoAnalysisSnapshotRow
): void {
  const checks: ReadonlyArray<readonly [string, number, number]> = [
    ['exposedMeshCount', Number(aggregate.values.exposedMeshCount), detail.summary.exposedMeshCount],
    [
      'exposedPopulation2050',
      Number(aggregate.values.exposedPopulation2050),
      Math.round(detail.summary.exposedPopulation2050),
    ],
    [
      'floodExposureShare2020',
      Number(aggregate.values.floodExposureShare2020),
      detail.summary.floodExposureShare2020,
    ],
    [
      'floodExposureShare2050',
      Number(aggregate.values.floodExposureShare2050),
      detail.summary.floodExposureShare2050,
    ],
  ];
  const failed = checks.find(([, actual, expected]) => actual !== expected);
  if (failed) {
    throw new Error(
      `${detail.areaCode}: ${failed[0]} conservation不一致 actual=${failed[1]} expected=${failed[2]}`
    );
  }
}
