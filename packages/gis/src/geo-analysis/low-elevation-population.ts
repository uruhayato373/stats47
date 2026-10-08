import { mesh1000BoundsFromCode } from './geo-analysis-core';
import {
  LOW_ELEVATION_G04_BASE_URL,
  LOW_ELEVATION_G04_ZIPS,
  LOW_ELEVATION_POPULATION_MEMBERS,
  LOW_ELEVATION_POPULATION_URL,
  LOW_ELEVATION_POPULATION_ZIP,
} from './low-elevation-inputs';

import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisSnapshotRow,
} from './snapshot';

/**
 * 標高の低い土地に住む人口。
 * 標高・傾斜度3次メッシュ(G04-a, 2011年度版)と1kmメッシュ人口(mesh1000r6-24, 2020年)を
 * 3次メッシュコードの完全一致で結合し、平均標高が0/5/10m以下のメッシュの人口を集計する。
 * 人口按分はしない。生成は low-elevation-population-overlay.py。ここは配信JSONの検証だけを持つ。
 */
export const LOW_ELEVATION_SLUG = 'population-low-elevation' as const;
export const LOW_ELEVATION_DATA_VERSION = 'G04-a-11_mesh1000r6-24_2020';
export const LOW_ELEVATION_THRESHOLDS_M = [0, 5, 10] as const;
export const LOW_ELEVATION_PRIMARY_THRESHOLD_M = 5;
export const LOW_ELEVATION_PRIMARY_METRIC_KEY = 'lowElevationShareMean5m';
/** 集計用の人口は小数4桁。10000倍した整数で足し合わせる。 */
export const LOW_ELEVATION_POPULATION_SCALE = 10000;
export const LOW_ELEVATION_BAND_LABELS = [
  '標高不明',
  '平均標高0m以下',
  '0m超5m以下',
  '5m超10m以下',
  '10m超',
] as const;

/**
 * 公開ページに掲載する原典表示。G04-a の2文は公式ページ「作成方法(原典表示)」の文言
 * (https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html, 2026-10-08 確認)。
 * 生成スクリプトが manifest.attribution に同じ文言を保存し、audit が一致を検査する。
 */
export const LOW_ELEVATION_ATTRIBUTION = {
  'G04-a': [
    'この地図は、国土地理院長の承認を得て、同院発行の基盤地図情報を使用したものである。(承認番号 平成25情使、第590号)',
    'この地図は、国土地理院長の承認を得て、同院発行の基盤地図情報を複製したものである。(承認番号 平成25情複、第581号)',
  ],
  mesh1000r6:
    '国土交通省国土数値情報「1kmメッシュ別将来推計人口(R6国政局推計)」(CC BY 4.0)の令和2年(2020年)人口を使用し、stats47が標高メッシュと結合・集計した',
} as const;

/** [meshId(3次メッシュコード), municipalityCode(原典SHICODE。複数市区町村にまたがる場合は_区切り), population2020, meanElevationM, maxElevationM, minElevationM] */
export type GeoLowElevationMesh = readonly [
  meshId: string,
  municipalityCode: string,
  population2020: number,
  meanElevationM: number | null,
  maxElevationM: number | null,
  minElevationM: number | null,
];

export interface GeoLowElevationBand {
  readonly label: string;
  readonly meshCount: number;
  readonly population: number;
  readonly sharePercent: number | null;
}
export interface GeoLowElevationThresholdBasis {
  readonly meshCount: number;
  readonly population: number;
  readonly sharePercent: number | null;
}
export interface GeoLowElevationThreshold {
  readonly thresholdM: number;
  readonly meanBased: GeoLowElevationThresholdBasis;
  readonly minBased: GeoLowElevationThresholdBasis;
}
export interface GeoLowElevationConservation {
  readonly meshPopulation: number;
  readonly meshPopulationRounded: number;
  readonly censusPopulation2020: number;
  readonly difference: number;
  readonly bandSumMatches: boolean;
  readonly bandMeshSumMatches: boolean;
  readonly matchesCensus: boolean;
}
export interface GeoLowElevationSummary {
  readonly meshCount: number;
  readonly population2020: number;
  readonly bands: readonly GeoLowElevationBand[];
  readonly thresholds: readonly GeoLowElevationThreshold[];
  readonly conservation: GeoLowElevationConservation;
}
export interface GeoLowElevationPrefDetail {
  readonly schemaVersion: 1;
  readonly slug: typeof LOW_ELEVATION_SLUG;
  readonly generatedAt: string;
  readonly areaCode: string;
  readonly areaName: string;
  readonly meshMethod: 'mesh-code-join';
  readonly columns: readonly [
    'meshId',
    'municipalityCode',
    'population2020',
    'meanElevationM',
    'maxElevationM',
    'minElevationM',
  ];
  readonly meshes: readonly GeoLowElevationMesh[];
  readonly summary: GeoLowElevationSummary;
}

const COLUMNS = [
  'meshId',
  'municipalityCode',
  'population2020',
  'meanElevationM',
  'maxElevationM',
  'minElevationM',
];
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const exactKeys = (x: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(x).length === keys.length && keys.every((k) => k in x);
const count = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sha = (x: unknown): x is string =>
  typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const timestamp = (x: unknown): x is string =>
  typeof x === 'string' &&
  /^\d{4}-\d{2}-\d{2}T/.test(x) &&
  Number.isFinite(Date.parse(x));
const AREA_CODE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

/** 標準3次メッシュコード(8桁)の境界 [西, 南, 東, 北]。度。範囲外・不正コードはnull。 */
export function lowElevationMeshBounds(
  code: string
): readonly [number, number, number, number] | null {
  // 2次メッシュの区画番号は0〜7。境界の算出は共通のmesh1000BoundsFromCodeを使う。
  if (!/^\d{4}[0-7]{2}\d{2}$/.test(code)) return null;
  const bounds = mesh1000BoundsFromCode(code);
  if (!bounds) return null;
  const [west, south] = bounds;
  return west >= 122 && west < 154 && south >= 20 && south < 46 ? bounds : null;
}

const scaled = (population: number) =>
  Math.round(population * LOW_ELEVATION_POPULATION_SCALE);
const round4 = (x: number) => Math.round(x * 10000) / 10000;
const share = (num: number, den: number) =>
  den > 0 ? round4((num / den) * 100) : null;

/** 平均標高による排他的5区分: 0=不明 1=0m以下 2=0m超5m以下 3=5m超10m以下 4=10m超。 */
export function lowElevationBand(mean: number | null): 0 | 1 | 2 | 3 | 4 {
  if (mean === null) return 0;
  if (mean <= 0) return 1;
  if (mean <= 5) return 2;
  if (mean <= 10) return 3;
  return 4;
}

/** 県詳細のメッシュ行から、配信summaryと同じ集計を決定的に再計算する(整数単位で加算)。 */
export function summarizeLowElevation(meshes: readonly GeoLowElevationMesh[]) {
  const bands = BAND_INIT();
  const mean = THRESHOLD_INIT();
  const min = THRESHOLD_INIT();
  let total = 0;
  for (const [, , population, meanElev, , minElev] of meshes) {
    const value = scaled(population);
    total += value;
    const band = lowElevationBand(meanElev);
    bands[band]![0] += 1;
    bands[band]![1] += value;
    LOW_ELEVATION_THRESHOLDS_M.forEach((threshold, i) => {
      if (meanElev !== null && meanElev <= threshold) {
        mean[i]![0] += 1;
        mean[i]![1] += value;
      }
      if (minElev !== null && minElev <= threshold) {
        min[i]![0] += 1;
        min[i]![1] += value;
      }
    });
  }
  return { meshCount: meshes.length, totalScaled: total, bands, mean, min };
}
const BAND_INIT = () =>
  LOW_ELEVATION_BAND_LABELS.map(() => [0, 0] as [number, number]);
const THRESHOLD_INIT = () =>
  LOW_ELEVATION_THRESHOLDS_M.map(() => [0, 0] as [number, number]);

const near = (a: unknown, b: number | null, tolerance: number) =>
  a === null || b === null
    ? a === b
    : typeof a === 'number' && Math.abs(a - b) <= tolerance;

/**
 * 県別途中artifactを検証する。メッシュ行から全集計を再計算してsummaryと照合し、
 * 国勢調査の都道府県人口との一致も要求する(manifestとの突合は呼び出し側)。
 */
export function parseGeoLowElevationPrefDetail(
  value: unknown,
  expectedAreaCode: string
): GeoLowElevationPrefDetail | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'slug',
      'generatedAt',
      'areaCode',
      'areaName',
      'meshMethod',
      'columns',
      'meshes',
      'summary',
    ]) ||
    value.schemaVersion !== 1 ||
    value.slug !== LOW_ELEVATION_SLUG ||
    !AREA_CODE.test(expectedAreaCode) ||
    value.areaCode !== expectedAreaCode ||
    !timestamp(value.generatedAt) ||
    typeof value.areaName !== 'string' ||
    !value.areaName.trim() ||
    value.meshMethod !== 'mesh-code-join' ||
    !same(value.columns, COLUMNS) ||
    !Array.isArray(value.meshes) ||
    value.meshes.length === 0 ||
    !record(value.summary)
  )
    return null;
  const pref = expectedAreaCode.slice(0, 2);
  const identities = new Set<string>();
  for (const row of value.meshes) {
    if (!Array.isArray(row) || row.length !== 6) return null;
    const [meshId, city, population, mean, max, min] = row as unknown[];
    if (
      typeof meshId !== 'string' ||
      !lowElevationMeshBounds(meshId) ||
      typeof city !== 'string' ||
      // 複数市区町村にまたがるメッシュは原典のSHICODEが「01101_01102」のように連結される。
      !/^\d{5}(?:_\d{5})*$/.test(city) ||
      !city.startsWith(pref) ||
      typeof population !== 'number' ||
      !Number.isFinite(population) ||
      population < 0 ||
      Math.abs(population * LOW_ELEVATION_POPULATION_SCALE - scaled(population)) >
        1e-3
    )
      return null;
    // 標高は3列とも値あり、または3列とも不明。最低<=平均<=最高。
    const elevation = [mean, max, min];
    if (elevation.every((x) => x === null)) {
      /* 標高不明 */
    } else if (
      !elevation.every((x) => typeof x === 'number' && Number.isFinite(x)) ||
      (min as number) > (mean as number) ||
      (mean as number) > (max as number)
    )
      return null;
    const identity = `${city}:${meshId}`;
    if (identities.has(identity)) return null;
    identities.add(identity);
  }
  const meshes = value.meshes as unknown as readonly GeoLowElevationMesh[];
  const recomputed = summarizeLowElevation(meshes);
  const s = value.summary;
  if (
    !exactKeys(s, [
      'meshCount',
      'population2020',
      'bands',
      'thresholds',
      'conservation',
    ]) ||
    s.meshCount !== recomputed.meshCount ||
    typeof s.population2020 !== 'number' ||
    scaled(s.population2020) !== recomputed.totalScaled ||
    !Array.isArray(s.bands) ||
    s.bands.length !== LOW_ELEVATION_BAND_LABELS.length ||
    !Array.isArray(s.thresholds) ||
    s.thresholds.length !== LOW_ELEVATION_THRESHOLDS_M.length ||
    !record(s.conservation)
  )
    return null;
  // 共有率の丸め方向(JS/Python)の差を吸収する。丸め前の値は上の整数加算で厳密に検証済み。
  const SHARE_TOLERANCE = 1.5e-4;
  for (let i = 0; i < s.bands.length; i++) {
    const band = s.bands[i];
    if (
      !record(band) ||
      !exactKeys(band, ['label', 'meshCount', 'population', 'sharePercent']) ||
      band.label !== LOW_ELEVATION_BAND_LABELS[i] ||
      band.meshCount !== recomputed.bands[i]![0] ||
      typeof band.population !== 'number' ||
      scaled(band.population) !== recomputed.bands[i]![1] ||
      !near(
        band.sharePercent,
        share(recomputed.bands[i]![1], recomputed.totalScaled),
        SHARE_TOLERANCE
      )
    )
      return null;
  }
  for (let i = 0; i < s.thresholds.length; i++) {
    const row = s.thresholds[i];
    if (
      !record(row) ||
      !exactKeys(row, ['thresholdM', 'meanBased', 'minBased']) ||
      row.thresholdM !== LOW_ELEVATION_THRESHOLDS_M[i]
    )
      return null;
    for (const [basis, expected] of [
      ['meanBased', recomputed.mean[i]!],
      ['minBased', recomputed.min[i]!],
    ] as const) {
      const entry = row[basis];
      if (
        !record(entry) ||
        !exactKeys(entry, ['meshCount', 'population', 'sharePercent']) ||
        entry.meshCount !== expected[0] ||
        typeof entry.population !== 'number' ||
        scaled(entry.population) !== expected[1] ||
        !near(
          entry.sharePercent,
          share(expected[1], recomputed.totalScaled),
          SHARE_TOLERANCE
        )
      )
        return null;
    }
    // 0m以下 ⊆ 5m以下 ⊆ 10m以下、平均基準 ⊆ 最低基準(上限側)
    if (
      i > 0 &&
      (recomputed.mean[i]![1] < recomputed.mean[i - 1]![1] ||
        recomputed.min[i]![1] < recomputed.min[i - 1]![1])
    )
      return null;
    if (recomputed.min[i]![1] < recomputed.mean[i]![1]) return null;
  }
  const c = s.conservation;
  if (
    !exactKeys(c, [
      'meshPopulation',
      'meshPopulationRounded',
      'censusPopulation2020',
      'difference',
      'bandSumMatches',
      'bandMeshSumMatches',
      'matchesCensus',
    ]) ||
    typeof c.meshPopulation !== 'number' ||
    scaled(c.meshPopulation) !== recomputed.totalScaled ||
    c.meshPopulationRounded !== Math.round(recomputed.totalScaled / 10000) ||
    !count(c.censusPopulation2020) ||
    c.bandSumMatches !== true ||
    c.bandMeshSumMatches !== true ||
    c.matchesCensus !== true ||
    c.meshPopulationRounded !== c.censusPopulation2020 ||
    typeof c.difference !== 'number' ||
    Math.abs(c.difference) >= 0.05 ||
    Math.abs(
      c.difference - (recomputed.totalScaled / 10000 - c.censusPopulation2020)
    ) > 1e-3
  )
    return null;
  return value as unknown as GeoLowElevationPrefDetail;
}

/** 配信summaryと集計行(item.json)の数値対応。manifestでのSHA照合の後に呼ぶ。 */
export function assertGeoLowElevationConservation(
  detail: GeoLowElevationPrefDetail,
  row: GeoAnalysisSnapshotRow
): void {
  const [t0, t5, t10] = detail.summary.thresholds as readonly [
    GeoLowElevationThreshold,
    GeoLowElevationThreshold,
    GeoLowElevationThreshold,
  ];
  const expected = {
    lowElevationShareMean5m: t5.meanBased.sharePercent,
    lowElevationShareMean0m: t0.meanBased.sharePercent,
    lowElevationShareMean10m: t10.meanBased.sharePercent,
    lowElevationShareMin0m: t0.minBased.sharePercent,
    lowElevationShareMin5m: t5.minBased.sharePercent,
    lowElevationShareMin10m: t10.minBased.sharePercent,
    population2020: detail.summary.population2020,
    lowElevationPopulationMean5m: t5.meanBased.population,
    elevationUnknownPopulation: detail.summary.bands[0]!.population,
  };
  if (
    row.areaCode !== detail.areaCode ||
    row.areaName !== detail.areaName ||
    !same(Object.keys(row.values).sort(), Object.keys(expected).sort()) ||
    Object.entries(expected).some(([key, value]) => row.values[key] !== value)
  )
    throw new Error('LowElevation detail/aggregate conservation failed');
}

/** 国勢調査2020の都道府県人口(manifest.censusReference)と県詳細の突合用。 */
export function lowElevationCensusPopulation(
  manifest: GeoAnalysisEvidenceManifest,
  areaCode: string
): number | null {
  const reference = (manifest as unknown as Record<string, unknown>)
    .censusReference;
  if (!record(reference) || !record(reference.populationByArea)) return null;
  const value = reference.populationByArea[areaCode];
  return count(value) ? value : null;
}

const STAGE_GRAPH = [
  ['population-mesh', 'source', 'calculation-input', 'ipss-population-mesh-1km'],
  ['elevation-mesh', 'source', 'calculation-input', 'ksj-g04a-elevation-mesh-3rd'],
  ['mesh-code-join', 'spatial-operation', 'derived', 'population-mesh', 'elevation-mesh'],
  ['prefecture-aggregate', 'aggregate', 'aggregate', 'mesh-code-join'],
] as const;
const DETAIL_MAX_BYTES = 5_000_000;
const artifact = (x: unknown): x is Record<string, unknown> =>
  record(x) &&
  typeof x.key === 'string' &&
  sha(x.sha256) &&
  count(x.bytes) &&
  x.bytes > 0 &&
  count(x.recordCount);

/**
 * manifestを検証する。入力は承認済み集合(low-elevation-inputs.ts)と完全一致、
 * 段階は人口 + 標高 → コード結合 → 集計、県別artifactは3段階で同一のSHA/bytes。
 */
export function parseGeoLowElevationManifest(
  value: unknown
): GeoAnalysisEvidenceManifest | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'slug',
      'generatedAt',
      'builder',
      'definitionSha256',
      'thresholdsM',
      'primaryThresholdM',
      'inputs',
      'contextLayers',
      'censusReference',
      'stages',
      'aggregate',
      'quality',
      'attribution',
    ]) ||
    value.schemaVersion !== 1 ||
    value.slug !== LOW_ELEVATION_SLUG ||
    !timestamp(value.generatedAt) ||
    !sha(value.definitionSha256) ||
    !same(value.thresholdsM, LOW_ELEVATION_THRESHOLDS_M) ||
    value.primaryThresholdM !== LOW_ELEVATION_PRIMARY_THRESHOLD_M ||
    !same(value.contextLayers, []) ||
    !same(value.attribution, LOW_ELEVATION_ATTRIBUTION) ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.stages) ||
    !record(value.censusReference) ||
    !record(value.quality)
  )
    return null;
  const census = value.censusReference;
  if (
    census.metricKey !== 'total-population' ||
    census.yearCode !== '2020' ||
    !record(census.populationByArea) ||
    Object.keys(census.populationByArea).length !== 47 ||
    !Object.entries(census.populationByArea).every(
      ([code, n]) => AREA_CODE.test(code) && count(n) && n > 0
    )
  )
    return null;

  // 入力: 標高176ファイル + 人口1ファイル(47県メンバー)。承認済み集合と完全一致。
  if (value.inputs.length !== LOW_ELEVATION_G04_ZIPS.length + 1) return null;
  for (let i = 0; i < LOW_ELEVATION_G04_ZIPS.length; i++) {
    const [code, bytes, hash] = LOW_ELEVATION_G04_ZIPS[i]!;
    const url = `${LOW_ELEVATION_G04_BASE_URL}G04-a-11_${code}-jgd_GML.zip`;
    const input = value.inputs[i];
    if (
      !record(input) ||
      input.layerId !== 'ksj-g04a-elevation-mesh-3rd' ||
      input.datasetId !== 'G04-a' ||
      input.version !== '11' ||
      input.url !== url ||
      input.key !== url.split('://')[1] ||
      input.sha256 !== hash ||
      input.bytes !== bytes ||
      !count(input.records) ||
      input.records <= 0 ||
      input.geometryMismatch !== 0 ||
      !timestamp(input.retrievedAt) ||
      input.geometry !== 'mesh' ||
      input.role !== 'calculation-input' ||
      input.usedInCalculation !== true
    )
      return null;
  }
  const pop = value.inputs[LOW_ELEVATION_G04_ZIPS.length];
  if (
    !record(pop) ||
    pop.layerId !== 'ipss-population-mesh-1km' ||
    pop.datasetId !== 'mesh1000r6' ||
    pop.version !== '24' ||
    pop.url !== LOW_ELEVATION_POPULATION_URL ||
    pop.key !== LOW_ELEVATION_POPULATION_URL.split('://')[1] ||
    pop.sha256 !== LOW_ELEVATION_POPULATION_ZIP.sha256 ||
    pop.bytes !== LOW_ELEVATION_POPULATION_ZIP.bytes ||
    !timestamp(pop.retrievedAt) ||
    pop.geometry !== 'mesh' ||
    pop.role !== 'calculation-input' ||
    pop.usedInCalculation !== true ||
    !Array.isArray(pop.members) ||
    pop.members.length !== LOW_ELEVATION_POPULATION_MEMBERS.length
  )
    return null;
  for (let i = 0; i < LOW_ELEVATION_POPULATION_MEMBERS.length; i++) {
    const [prefCode, bytes, zipHash, jsonHash, records] =
      LOW_ELEVATION_POPULATION_MEMBERS[i]!;
    const member = pop.members[i];
    if (
      !record(member) ||
      member.pref !== prefCode ||
      member.bytes !== bytes ||
      member.sha256 !== zipHash ||
      member.geojsonSha256 !== jsonHash ||
      member.records !== records ||
      member.geometryMismatch !== 0
    )
      return null;
  }

  // 段階
  const aggregate = value.aggregate;
  const root = `app/geo/${LOW_ELEVATION_SLUG}`;
  if (
    !artifact(aggregate) ||
    !exactKeys(aggregate, ['key', 'sha256', 'bytes', 'recordCount']) ||
    aggregate.key !== `${root}/item.json` ||
    aggregate.recordCount !== 47 ||
    value.stages.length !== STAGE_GRAPH.length
  )
    return null;
  const perArea = new Map<string, Record<string, unknown>>();
  const recordCounts: number[] = [];
  for (let i = 0; i < STAGE_GRAPH.length; i++) {
    const stage = value.stages[i];
    const [id, kind, role, ...refs] = STAGE_GRAPH[i]!;
    if (
      !record(stage) ||
      !exactKeys(stage, [
        'id',
        'label',
        'kind',
        'role',
        'inputIds',
        'operation',
        'outputKeyPattern',
        'outputs',
      ]) ||
      stage.id !== id ||
      stage.kind !== kind ||
      stage.role !== role ||
      !same(stage.inputIds, refs) ||
      typeof stage.label !== 'string' ||
      !stage.label.trim() ||
      typeof stage.operation !== 'string' ||
      !stage.operation.trim() ||
      typeof stage.outputKeyPattern !== 'string' ||
      !Array.isArray(stage.outputs)
    )
      return null;
    if (kind === 'aggregate') {
      if (!same(stage.outputs, [aggregate])) return null;
      continue;
    }
    if (stage.outputs.length !== 47) return null;
    let records = 0;
    for (let n = 0; n < 47; n++) {
      const output = stage.outputs[n];
      const code = `${String(n + 1).padStart(2, '0')}000`;
      if (
        !artifact(output) ||
        !exactKeys(output, ['key', 'sha256', 'bytes', 'recordCount', 'areaCode']) ||
        output.areaCode !== code ||
        output.key !== `${root}/pref/${code.slice(0, 2)}.json` ||
        Number(output.bytes) > DETAIL_MAX_BYTES
      )
        return null;
      const previous = perArea.get(code);
      if (previous && !same(previous, output)) return null;
      perArea.set(code, output);
      records += Number(output.recordCount);
    }
    recordCounts.push(records);
  }
  const q = value.quality;
  const maxBytes = Math.max(...[...perArea.values()].map((o) => Number(o.bytes)));
  const nationalMeshPopulation =
    (q.nationalConservation as Record<string, unknown> | undefined) ?? null;
  if (
    !exactKeys(q, [
      'expectedAreas',
      'detailAreas',
      'conservationChecks',
      'sourceRecords',
      'derivedRecords',
      'populatedMeshes',
      'maxDetailBytes',
      'nationalConservation',
    ]) ||
    q.expectedAreas !== 47 ||
    q.detailAreas !== 47 ||
    q.conservationChecks !== 47 ||
    !count(q.sourceRecords) ||
    !count(q.derivedRecords) ||
    !count(q.populatedMeshes) ||
    q.populatedMeshes <= 0 ||
    q.derivedRecords !== q.populatedMeshes ||
    recordCounts.some((n) => n !== q.populatedMeshes) ||
    q.maxDetailBytes !== maxBytes ||
    !record(nationalMeshPopulation) ||
    typeof nationalMeshPopulation.meshPopulation !== 'number' ||
    nationalMeshPopulation.censusPopulation2020 !==
      Object.values(census.populationByArea).reduce(
        (a: number, b) => a + Number(b),
        0
      ) ||
    Math.round(nationalMeshPopulation.meshPopulation) !==
      nationalMeshPopulation.censusPopulation2020
  )
    return null;
  return value as unknown as GeoAnalysisEvidenceManifest;
}
