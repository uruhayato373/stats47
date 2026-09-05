import {
  FLOOD_ARCHIVES,
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type GeoAnalysisPrefDetail,
  type GeoAnalysisSnapshot,
} from '@stats47/gis';

import {
  bindFixtureArtifact,
  GENERATED_AT,
  manifestFixture,
} from './geo-manifest-fixture';

import type { GeoCrossAnalysisSlug } from '../geo-cross-analysis';

// 合成座標を県コード別に複製した配信契約fixture。実際の県分布の検証には使わない。
function detailFixture(
  slug: GeoCrossAnalysisSlug,
  pref: string
): GeoAnalysisPrefDetail {
  const areaCode = `${pref}000`;
  const common = {
    generatedAt: GENERATED_AT,
    areaCode,
    areaName: `合成県${pref}`,
  };
  const mesh = {
    meshId: '53394525',
    areaCode,
    longitude: 139.70625,
    latitude: 35.6041665,
    bounds: [139.7, 35.6, 139.7125, 35.608333] as const,
    population2020: 100,
    population2050: 80,
    floodDepthClass: 2,
  };
  if (slug === 'population-land-price')
    return buildLandPricePrefDetail({
      ...common,
      meshes: [mesh],
      points: [
        {
          id: `point-${pref}`,
          areaCode,
          longitude: mesh.longitude,
          latitude: mesh.latitude,
          price: 100_000,
          change: 5,
        },
      ],
    });
  if (slug === 'population-flood-risk')
    return buildFloodPrefDetail({ ...common, meshes: [mesh] });
  return {
    ...common,
    schemaVersion: 1,
    slug,
    accessRadiusMeters: 800,
    meshMethod: 'center-point',
    meshes: [
      [
        mesh.meshId,
        139_700_000,
        35_600_000,
        139_712_500,
        35_608_333,
        100,
        80,
        1,
      ],
    ],
    stations: [[`station-${pref}`, '合成駅', 139_706_250, 35_604_167]],
    summary: {
      meshCount: 1,
      accessibleMeshCount: 1,
      displayedStationCount: 1,
      population2020: 100,
      population2050: 80,
      accessiblePopulation2020: 100,
      accessiblePopulation2050: 80,
      stationAccessShare2020: 100,
      stationAccessShare2050: 100,
    },
  };
}

export function geoArtifactBundleFixture(
  slug: GeoCrossAnalysisSlug
): Map<string, unknown> {
  const objects = new Map<string, unknown>();
  let manifest = manifestFixture(slug);
  const primaryMetricKey = {
    'population-land-price': 'risingDecliningPointShare',
    'population-flood-risk': 'floodExposureShare2050',
    'population-station-access': 'stationAccessShare2050',
  }[slug];
  const rows = Array.from({ length: 47 }, (_, index) => {
    const pref = String(index + 1).padStart(2, '0');
    const detail = detailFixture(slug, pref);
    objects.set(`pref/${pref}`, detail);
    manifest = bindFixtureArtifact(
      manifest,
      `app/geo/${slug}/pref/${pref}.json`,
      detail
    );
    return {
      areaCode: detail.areaCode,
      areaName: detail.areaName,
      rank: index + 1,
      values: { [primaryMetricKey]: 100 },
    };
  });
  const snapshot: GeoAnalysisSnapshot = {
    schemaVersion: 1,
    slug,
    generatedAt: GENERATED_AT,
    geography: 'prefecture',
    dataVersion: 'synthetic-2020-2050',
    title: '合成配信fixture',
    question: '契約は一致するか',
    primaryMetricKey,
    metrics: [
      {
        key: primaryMetricKey,
        label: '合成比率',
        unit: '%',
        format: 'percent1',
        description: '合成入力の比率',
      },
    ],
    rows,
    summary: {
      observationCount: 47,
      medianValue: 100,
      topAreaCodes: [rows[0]!.areaCode],
      bottomAreaCodes: [rows[46]!.areaCode],
    },
    method: ['合成メッシュの保存則を検算'],
    sources: [
      {
        name: '合成fixture',
        url: 'https://example.com/fixture',
        datasetId: 'TEST',
        version: '1',
        license: 'test-only',
      },
    ],
    caveats: ['実地域の観測値ではない'],
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: {
        records: 47,
        ...(slug === 'population-flood-risk'
          ? { floodZipFiles: FLOOD_ARCHIVES.length }
          : {}),
      },
      coverageNote: '47県コードの合成fixture',
    },
  };
  manifest = bindFixtureArtifact(
    manifest,
    `app/geo/${slug}/item.json`,
    snapshot,
    true
  );
  objects.set('item', snapshot);
  objects.set('manifest', manifest);
  return objects;
}
