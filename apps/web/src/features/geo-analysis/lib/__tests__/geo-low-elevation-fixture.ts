import { createHash } from 'node:crypto';

import {
  LOW_ELEVATION_ATTRIBUTION,
  LOW_ELEVATION_BAND_LABELS,
  LOW_ELEVATION_DATA_VERSION,
  LOW_ELEVATION_SLUG,
  LOW_ELEVATION_THRESHOLDS_M,
  summarizeLowElevation,
  type GeoLowElevationMesh,
} from '@stats47/gis';

import {
  LOW_ELEVATION_G04_BASE_URL,
  LOW_ELEVATION_G04_ZIPS,
  LOW_ELEVATION_POPULATION_MEMBERS,
  LOW_ELEVATION_POPULATION_URL,
  LOW_ELEVATION_POPULATION_ZIP,
} from '../../../../../../../packages/gis/src/geo-analysis/low-elevation-inputs';

export { LOW_ELEVATION_SLUG };
export const LOW_ELEVATION_FIXTURE_GENERATED_AT = '2026-10-08T04:00:00.000Z';
const prefix = `app/geo/${LOW_ELEVATION_SLUG}`;
const round4 = (x: number) => Math.round(x * 10000) / 10000;
const share = (n: number, d: number) => round4((n / d) * 100);
const codes = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'));

function canonical(value: unknown, pretty: boolean) {
  const body = `${JSON.stringify(value, null, pretty ? 2 : undefined)}\n`;
  return {
    sha256: createHash('sha256').update(body).digest('hex'),
    bytes: Buffer.byteLength(body),
  };
}

/** 県ごとに3メッシュ。実際の標高分布ではなく、配信契約と保存則の検証用。 */
export function lowElevationMeshesFixture(pref: string): GeoLowElevationMesh[] {
  const n = Number(pref);
  const city = `${pref}101`;
  return [
    ['53394611', city, round4(1000.0004 + n), -0.4, 2, -1],
    ['53394612', city, 2000 + n, 4, 6, 1],
    ['53394621', `${city}_${pref}102`, 3000 + n, 20, 40, 5],
    ['53394631', city, 7.0001, null, null, null],
  ];
}

export function lowElevationDetailFixture(pref: string) {
  const meshes = lowElevationMeshesFixture(pref);
  const r = summarizeLowElevation(meshes);
  const people = (scaled: number) => scaled / 10000;
  const total = people(r.totalScaled);
  const census = Math.round(total);
  return {
    schemaVersion: 1,
    slug: LOW_ELEVATION_SLUG,
    generatedAt: LOW_ELEVATION_FIXTURE_GENERATED_AT,
    areaCode: `${pref}000`,
    areaName: `県${pref}`,
    meshMethod: 'mesh-code-join',
    columns: ['meshId', 'municipalityCode', 'population2020', 'meanElevationM', 'maxElevationM', 'minElevationM'],
    meshes: meshes.map((m) => [...m]),
    summary: {
      meshCount: r.meshCount,
      population2020: total,
      bands: LOW_ELEVATION_BAND_LABELS.map((label, i) => ({
        label,
        meshCount: r.bands[i]![0],
        population: people(r.bands[i]![1]),
        sharePercent: share(r.bands[i]![1], r.totalScaled),
      })),
      thresholds: LOW_ELEVATION_THRESHOLDS_M.map((thresholdM, i) => ({
        thresholdM,
        meanBased: {
          meshCount: r.mean[i]![0],
          population: people(r.mean[i]![1]),
          sharePercent: share(r.mean[i]![1], r.totalScaled),
        },
        minBased: {
          meshCount: r.min[i]![0],
          population: people(r.min[i]![1]),
          sharePercent: share(r.min[i]![1], r.totalScaled),
        },
      })),
      conservation: {
        meshPopulation: total,
        meshPopulationRounded: census,
        censusPopulation2020: census,
        difference: round4(total - census),
        bandSumMatches: true,
        bandMeshSumMatches: true,
        matchesCensus: true,
      },
    },
  };
}

/** item.json / manifest.json / pref/NN.json を、配信契約どおりの正準JSONとSHAで合成する。 */
export function lowElevationBundleFixture(): { objects: Map<string, unknown> } {
  const objects = new Map<string, unknown>();
  const details = codes.map((pref) => lowElevationDetailFixture(pref));
  details.forEach((detail, i) => objects.set(`pref/${codes[i]}`, detail));

  const rows = details.map((detail) => {
    const t = detail.summary.thresholds;
    return {
      areaCode: detail.areaCode,
      areaName: detail.areaName,
      values: {
        lowElevationShareMean5m: t[1]!.meanBased.sharePercent,
        lowElevationShareMean0m: t[0]!.meanBased.sharePercent,
        lowElevationShareMean10m: t[2]!.meanBased.sharePercent,
        lowElevationShareMin0m: t[0]!.minBased.sharePercent,
        lowElevationShareMin5m: t[1]!.minBased.sharePercent,
        lowElevationShareMin10m: t[2]!.minBased.sharePercent,
        population2020: detail.summary.population2020,
        lowElevationPopulationMean5m: t[1]!.meanBased.population,
        elevationUnknownPopulation: detail.summary.bands[0]!.population,
      },
    };
  });
  const primary = (row: (typeof rows)[number]) => row.values.lowElevationShareMean5m!;
  const ranked = rows
    .map((row) => ({
      ...row,
      rank: 1 + rows.filter((other) => primary(other) > primary(row)).length,
    }))
    .sort((a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode));
  const sorted = [...ranked].sort((a, b) => primary(b) - primary(a) || a.areaCode.localeCompare(b.areaCode));
  const item = {
    schemaVersion: 1,
    slug: LOW_ELEVATION_SLUG,
    generatedAt: LOW_ELEVATION_FIXTURE_GENERATED_AT,
    dataVersion: LOW_ELEVATION_DATA_VERSION,
    geography: 'prefecture',
    title: '標高の低い土地に、どれだけの人が住んでいるか',
    question: '合成fixture',
    primaryMetricKey: 'lowElevationShareMean5m',
    metrics: [
      ['lowElevationShareMean5m', '平均標高5m以下の地域の人口割合', '%', 'percent1'],
      ['lowElevationShareMean0m', '平均標高0m以下の地域の人口割合', '%', 'percent1'],
      ['lowElevationShareMean10m', '平均標高10m以下の地域の人口割合', '%', 'percent1'],
      ['lowElevationShareMin5m', '最低標高5m以下を含む地域の人口割合', '%', 'percent1'],
      ['population2020', '2020年人口', '人', 'integer'],
      ['lowElevationPopulationMean5m', '平均標高5m以下の地域の人口', '人', 'integer'],
    ].map(([key, label, unit, format]) => ({ key, label, unit, format, description: label })),
    rows: ranked,
    summary: {
      observationCount: 47,
      medianValue: primary(sorted[23]!),
      topAreaCodes: sorted.slice(0, 3).map((row) => row.areaCode),
      bottomAreaCodes: sorted.slice(-3).map((row) => row.areaCode),
    },
    method: ['合成fixture'],
    sources: [
      { name: '標高', url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html', datasetId: 'G04-a', version: '11', license: '商用可' },
      { name: '人口', url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html', datasetId: 'mesh1000r6', version: '24', license: 'CC BY 4.0' },
    ],
    caveats: ['合成fixture'],
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: { populationMeshes: 47 * 4 },
      coverageNote: '合成fixture',
    },
  };
  objects.set('item', item);

  const detailOutputs = details.map((detail, i) => ({
    key: `${prefix}/pref/${codes[i]}.json`,
    ...canonical(detail, false),
    recordCount: detail.meshes.length,
    areaCode: detail.areaCode,
  }));
  const aggregate = { key: `${prefix}/item.json`, ...canonical(item, true), recordCount: 47 };
  const stage = (id: string, label: string, kind: string, role: string, inputIds: string[], outputs: unknown[]) => ({
    id, label, kind, role, inputIds, operation: `${label}の合成fixture`, outputKeyPattern: `${prefix}/pref/{NN}.json`, outputs,
  });
  const retrievedAt = '2026-10-08T00:19:02Z';
  const manifest = {
    schemaVersion: 1,
    slug: LOW_ELEVATION_SLUG,
    generatedAt: LOW_ELEVATION_FIXTURE_GENERATED_AT,
    builder: 'packages/gis/src/geo-analysis/low-elevation-population-overlay.py',
    definitionSha256: 'a'.repeat(64),
    thresholdsM: [...LOW_ELEVATION_THRESHOLDS_M],
    primaryThresholdM: 5,
    inputs: [
      ...LOW_ELEVATION_G04_ZIPS.map(([code, bytes, sha256]) => {
        const url = `${LOW_ELEVATION_G04_BASE_URL}G04-a-11_${code}-jgd_GML.zip`;
        return {
          layerId: 'ksj-g04a-elevation-mesh-3rd', datasetId: 'G04-a', version: '11',
          key: url.split('://')[1], url, sha256, bytes, records: 100, geometryMismatch: 0, retrievedAt,
          geometry: 'mesh', role: 'calculation-input', usedInCalculation: true,
        };
      }),
      {
        layerId: 'ipss-population-mesh-1km', datasetId: 'mesh1000r6', version: '24',
        key: LOW_ELEVATION_POPULATION_URL.split('://')[1], url: LOW_ELEVATION_POPULATION_URL,
        sha256: LOW_ELEVATION_POPULATION_ZIP.sha256, bytes: LOW_ELEVATION_POPULATION_ZIP.bytes, retrievedAt,
        geometry: 'mesh', role: 'calculation-input', usedInCalculation: true,
        members: LOW_ELEVATION_POPULATION_MEMBERS.map(([pref, bytes, sha256, geojsonSha256, records]) => ({
          pref, member: `fixture/${pref}.zip`, bytes, sha256, geojson: `fixture/${pref}.geojson`, geojsonBytes: 1, geojsonSha256, records, geometryMismatch: 0,
        })),
      },
    ],
    contextLayers: [],
    censusReference: {
      metricKey: 'total-population',
      yearCode: '2020',
      source: '合成fixture',
      populationByArea: Object.fromEntries(
        details.map((detail) => [detail.areaCode, detail.summary.conservation.censusPopulation2020])
      ),
    },
    stages: [
      stage('population-mesh', '人口', 'source', 'calculation-input', ['ipss-population-mesh-1km'], detailOutputs),
      stage('elevation-mesh', '標高', 'source', 'calculation-input', ['ksj-g04a-elevation-mesh-3rd'], detailOutputs),
      stage('mesh-code-join', '結合', 'spatial-operation', 'derived', ['population-mesh', 'elevation-mesh'], detailOutputs),
      { ...stage('prefecture-aggregate', '集計', 'aggregate', 'aggregate', ['mesh-code-join'], [aggregate]), outputKeyPattern: `${prefix}/item.json` },
    ],
    aggregate,
    quality: {
      expectedAreas: 47, detailAreas: 47, conservationChecks: 47,
      sourceRecords: details.length * 4 * 2, derivedRecords: details.length * 4, populatedMeshes: details.length * 4,
      maxDetailBytes: Math.max(...detailOutputs.map((o) => o.bytes)),
      nationalConservation: {
        meshPopulation: details.reduce((sum, d) => sum + d.summary.population2020, 0),
        censusPopulation2020: details.reduce((sum, d) => sum + d.summary.conservation.censusPopulation2020, 0),
      },
    },
    attribution: LOW_ELEVATION_ATTRIBUTION,
  };
  objects.set('manifest', manifest);
  return { objects };
}
