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
  return {
    schemaVersion: 1,
    slug: 'population-land-price',
    generatedAt: input.generatedAt,
    areaCode: input.areaCode,
    areaName: input.areaName,
    meshes,
    landPricePoints,
    summary: {
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
