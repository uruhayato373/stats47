
import {
  mesh1000BoundsFromCode,
  type GeoAnalysisEvidenceManifest,
  type GeoAnalysisSnapshot,
  type GeoPublicFacilityMesh,
  type GeoPublicFacilityPoint,
  type GeoPublicFacilityPrefDetail,
  type GeoPublicFacilitySourceSnapshot,
} from '@stats47/gis';

import {
  PUBLIC_FACILITY_BANDS,
  createPublicFacilitySearch,
  publicFacilityAggregateValues,
  summarizePublicFacilityMeshes,
} from '../../../../../../../packages/gis/src/geo-analysis/public-facility-access';

import { artifact, GENERATED_AT } from './geo-manifest-fixture';


export const PUBLIC_FACILITY_SLUG = 'population-public-facility-access';
const prefix = `app/geo/${PUBLIC_FACILITY_SLUG}`;

// Synthetic coordinates repeat across 47 area codes. This tests delivery and conservation,
// not prefecture boundaries or actual national nearest-facility correctness.
export function publicFacilityDetailFixture(
  pref: string
): GeoPublicFacilityPrefDetail {
  const areaCode = `${pref}000`;
  const index = Number(pref);
  const bounds = mesh1000BoundsFromCode('53394525')!;
  const longitude =
    (Math.round(bounds[0] * 1e6) + Math.round(bounds[2] * 1e6)) / 2e6;
  const latitude =
    (Math.round(bounds[1] * 1e6) + Math.round(bounds[3] * 1e6)) / 2e6;
  const distances = [100, 700, 2000, 4000, 7000];
  const otherPref = String(index === 47 ? 1 : index + 1).padStart(2, '0');
  const point = (
    id: number,
    code: string,
    type: string,
    meters: number
  ): GeoPublicFacilityPoint => [
    index * 10 + id,
    `P05-22:${code}:${index * 10 + id}`,
    `${code}001`,
    type,
    `合成施設${index}-${id}`,
    longitude,
    latitude + ((meters / 6371008.8) * 180) / Math.PI,
  ];
  const facilities = [
    point(0, pref, '1', distances[index % 5]!),
    point(1, pref, '3', 12000), // Retain a county source facility even when never nearest.
    point(2, pref, '4', distances[(index + 2) % 5]!),
    ...(index % 2 === 0 ? [point(3, otherPref, '2', 50)] : []),
  ];
  const nearest = createPublicFacilitySearch(facilities);
  const admin = nearest(longitude, latitude, 'administrative');
  const meeting = nearest(longitude, latitude, 'meeting');
  const meshes: GeoPublicFacilityMesh[] = [
    [
      '53394525',
      longitude,
      latitude,
      index * 100,
      index * 80,
      admin.point[0],
      admin.distanceMeters,
      admin.bandIndex,
      meeting.point[0],
      meeting.distanceMeters,
      meeting.bandIndex,
    ],
  ];
  return {
    schemaVersion: 1,
    slug: PUBLIC_FACILITY_SLUG,
    generatedAt: GENERATED_AT,
    areaCode,
    areaName: `合成県${pref}`,
    bands: PUBLIC_FACILITY_BANDS,
    meshes,
    facilities,
    summary: summarizePublicFacilityMeshes(meshes, facilities, areaCode),
  };
}

export function publicFacilityBundleFixture() {
  const objects = new Map<string, unknown>();
  const details = Array.from({ length: 47 }, (_, i) =>
    publicFacilityDetailFixture(String(i + 1).padStart(2, '0'))
  );
  const rows = details.map((detail, i) => ({
    areaCode: detail.areaCode,
    areaName: detail.areaName,
    rank: i + 1,
    values: publicFacilityAggregateValues(detail),
  }));
  const primaryMetricKey = 'administrativeWithin1000mShare2020';
  const snapshot: GeoAnalysisSnapshot = {
    schemaVersion: 1,
    slug: PUBLIC_FACILITY_SLUG,
    generatedAt: GENERATED_AT,
    geography: 'prefecture',
    dataVersion: 'synthetic-P05-22_population2020-2050',
    title: '公共施設の合成配信fixture',
    question: '2群の人口は独立して保存されるか',
    primaryMetricKey,
    metrics: [
      {
        key: primaryMetricKey,
        label: '行政施設1km以内人口比率',
        unit: '%',
        format: 'percent1',
        description: '合成人口を分母とする比率',
      },
    ],
    rows,
    summary: {
      observationCount: 47,
      medianValue: 100,
      topAreaCodes: ['01000'],
      bottomAreaCodes: ['47000'],
    },
    method: [
      '原典施設と人口メッシュを保持し、2群別に最寄り大円距離を5帯へ分類する',
    ],
    sources: [
      {
        name: '合成fixture',
        url: 'https://example.com/fixture',
        datasetId: 'TEST',
        version: '1',
        license: 'test-only',
      },
    ],
    caveats: ['実地域の観測値ではない。2群の人口は合算しない。'],
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: { populationMeshes: 47, publicFacilities: 141 },
      coverageNote: '47県コードの合成fixture',
    },
  };
  const detailOutputs = details.map((detail) => {
    const pref = detail.areaCode.slice(0, 2);
    objects.set(`pref/${pref}`, detail);
    return {
      ...artifact(`${prefix}/pref/${pref}.json`, detail),
      areaCode: detail.areaCode,
      recordCount: detail.meshes.length,
    };
  });
  const sourceOutputs = details.map((detail) => {
    const pref = detail.areaCode.slice(0, 2);
    const source: GeoPublicFacilitySourceSnapshot = {
      schemaVersion: 1,
      slug: PUBLIC_FACILITY_SLUG,
      generatedAt: GENERATED_AT,
      areaCode: detail.areaCode,
      facilities: detail.facilities.filter((point) =>
        point[2].startsWith(pref)
      ),
    };
    objects.set(`source/${pref}`, source);
    return {
      ...artifact(`${prefix}/source/${pref}.json`, source),
      areaCode: detail.areaCode,
      recordCount: source.facilities.length,
    };
  });
  const aggregate = {
    ...artifact(`${prefix}/item.json`, snapshot, true),
    recordCount: 47,
  };
  const manifest: GeoAnalysisEvidenceManifest = {
    schemaVersion: 1,
    slug: PUBLIC_FACILITY_SLUG,
    generatedAt: GENERATED_AT,
    definitionSha256: 'a'.repeat(64),
    inputs: details.flatMap((detail) => {
      const pref = detail.areaCode.slice(0, 2);
      return [
        {
          layerId: 'ipss-population-mesh-1km',
          datasetId: 'mesh1000r6',
          version: '24',
          geometry: 'mesh' as const,
          role: 'calculation-input' as const,
          usedInCalculation: true,
          ...artifact(`gis/mlit-ksj/mesh1000r6/24/${pref}.topojson`),
        },
        {
          layerId: 'ksj-p05-public-facility-point',
          datasetId: 'P05',
          version: '22',
          geometry: 'point' as const,
          role: 'calculation-input' as const,
          usedInCalculation: true,
          ...artifact(`gis/mlit-ksj/P05/22/${pref}.geojson`),
        },
      ];
    }),
    stages: [
      {
        id: 'population-mesh',
        label: '人口',
        kind: 'source',
        role: 'calculation-input',
        inputIds: ['ipss-population-mesh-1km'],
        operation: '人口メッシュの保持',
        outputKeyPattern: `${prefix}/pref/{NN}.json`,
        outputs: detailOutputs,
      },
      {
        id: 'public-facility-points',
        label: '原典施設',
        kind: 'source',
        role: 'calculation-input',
        inputIds: ['ksj-p05-public-facility-point'],
        operation: '県内原典施設の保持',
        outputKeyPattern: `${prefix}/source/{NN}.json`,
        outputs: sourceOutputs,
      },
      {
        id: 'nearest-facility-distance',
        label: '最寄り距離',
        kind: 'spatial-operation',
        role: 'derived',
        inputIds: ['population-mesh', 'public-facility-points'],
        operation: '2群別の最寄り距離',
        outputKeyPattern: `${prefix}/pref/{NN}.json`,
        outputs: detailOutputs,
      },
      {
        id: 'distance-band-population',
        label: '5帯集計',
        kind: 'aggregate',
        role: 'aggregate',
        inputIds: ['nearest-facility-distance'],
        operation: '群別・年別の保存則',
        outputKeyPattern: `${prefix}/item.json`,
        outputs: [aggregate],
      },
    ],
    aggregate,
    quality: {
      expectedAreas: 47,
      detailAreas: 47,
      conservationChecks: 47,
      sourceRecords: 188,
      derivedRecords: 47,
      populatedMeshes: 47,
      maxDetailBytes: Math.max(...detailOutputs.map((output) => output.bytes)),
    },
  };
  objects.set('manifest', manifest);
  objects.set('item', snapshot);
  return { objects, details, snapshot, manifest };
}
