import { SNOW_DESIGNATION_DEFINITION_SHA256 } from './snow-designation-definition';
import { SNOW_DESIGNATION_SOURCE as SOURCE } from '../../../data-configs/src/theme-catalog/snow-designation-source';

/** Population units are 1/10000 person. Codes are integers only to keep every county below 5 MB. */
export type GeoSnowMesh = readonly [number, number, number, 0 | 1 | 2, number];
export interface GeoSnowSummary {
  populationScaled: readonly [number, number, number];
  lowerScaled: readonly [number, number];
  upperScaled: readonly [number, number];
  boundaryScaled: readonly [number, number];
  exactEdgeCount: number;
  populationTotalScaled: number;
  populatedRecords: number;
  rawRecords: number;
  zeroRecords: number;
  regularOnlyAreaKm2: number;
  specialAreaKm2: number;
  designatedAreaKm2: number;
}
export interface GeoSnowPrefDetail {
  schemaVersion: 1;
  slug: typeof SOURCE.slug;
  dataVersion: typeof SOURCE.dataVersion;
  generatedAt: string;
  areaCode: string;
  areaName: string;
  populationScale: 10000;
  cellColumns: readonly [
    'meshCode',
    'municipalityCode',
    'population2020Scaled',
    'centerClass',
    'sensitivityFlags',
  ];
  classes: readonly [
    'center-outside-input-polygon',
    'regular-only',
    'special-heavy-snow',
  ];
  flagBits: {
    totalLower: 1;
    totalUpper: 2;
    specialLower: 4;
    specialUpper: 8;
    totalBoundaryCell: 16;
    centerOnEdge: 32;
  };
  meshes: readonly GeoSnowMesh[];
  summary: GeoSnowSummary;
}
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const exactKeys = (x: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(x).length === keys.length && keys.every((k) => k in x);
const integer = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const tuple = (x: unknown, n: number): x is number[] =>
  Array.isArray(x) && x.length === n && x.every(integer);
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function snowMeshBounds(
  code: number
): readonly [number, number, number, number] | null {
  const s = String(code);
  if (!/^\d{4}[0-7]{2}\d{2}[1-4]{2}$/.test(s)) return null;
  let south =
    (Number(s.slice(0, 2)) * 2) / 3 + Number(s[4]) / 12 + Number(s[6]) / 120;
  let west = 100 + Number(s.slice(2, 4)) + Number(s[5]) / 8 + Number(s[7]) / 80;
  let width = 1 / 80,
    height = 1 / 120;
  for (const q of s.slice(8)) {
    width /= 2;
    height /= 2;
    west += ((Number(q) - 1) % 2) * width;
    south += Math.floor((Number(q) - 1) / 2) * height;
  }
  return west >= 122 && west < 154 && south >= 20 && south < 46
    ? [west, south, west + width, south + height]
    : null;
}

export function parseGeoSnowPrefDetail(
  value: unknown,
  expectedAreaCode: string
): GeoSnowPrefDetail | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'slug',
      'dataVersion',
      'generatedAt',
      'areaCode',
      'areaName',
      'populationScale',
      'cellColumns',
      'classes',
      'flagBits',
      'meshes',
      'summary',
    ]) ||
    value.schemaVersion !== 1 ||
    value.slug !== SOURCE.slug ||
    value.dataVersion !== SOURCE.dataVersion ||
    value.areaCode !== expectedAreaCode ||
    !/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(expectedAreaCode) ||
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    typeof value.areaName !== 'string' ||
    !value.areaName.trim() ||
    value.populationScale !== 10000 ||
    !same(value.cellColumns, [
      'meshCode',
      'municipalityCode',
      'population2020Scaled',
      'centerClass',
      'sensitivityFlags',
    ]) ||
    !same(value.classes, [
      'center-outside-input-polygon',
      'regular-only',
      'special-heavy-snow',
    ]) ||
    !same(value.flagBits, {
      totalLower: 1,
      totalUpper: 2,
      specialLower: 4,
      specialUpper: 8,
      totalBoundaryCell: 16,
      centerOnEdge: 32,
    }) ||
    !Array.isArray(value.meshes) ||
    !value.meshes.length ||
    !record(value.summary)
  )
    return null;
  const pref = expectedAreaCode.slice(0, 2);
  const expectedName = SOURCE.populationSources.find(
    (p) => p.areaCode === expectedAreaCode
  )?.areaName;
  if (value.areaName !== expectedName) return null;
  const totals = [0, 0, 0],
    lower = [0, 0],
    upper = [0, 0],
    boundary = [0, 0],
    identities = new Set<string>();
  let exactEdges = 0;
  for (const row of value.meshes) {
    if (
      !tuple(row, 5) ||
      !snowMeshBounds(row[0]!) ||
      row[2]! <= 0 ||
      row[3]! > 2 ||
      row[4]! > 63
    )
      return null;
    const [mesh, city, pop, kind, flags] = row as [
      number,
      number,
      number,
      number,
      number,
    ];
    const cityCode = String(city).padStart(5, '0'),
      id = `${cityCode}:${mesh}`;
    if (
      cityCode.length !== 5 ||
      !cityCode.startsWith(pref) ||
      identities.has(id)
    )
      return null;
    identities.add(id);
    const lo = [!!(flags & 1), !!(flags & 4)],
      hi = [!!(flags & 2), !!(flags & 8)],
      inside = [kind > 0, kind === 2];
    for (let i = 0; i < 2; i++) {
      if ((lo[i] && !inside[i]) || (inside[i] && !hi[i])) return null;
      if (lo[i]) lower[i]! += pop;
      if (hi[i]) upper[i]! += pop;
      if (hi[i] && !lo[i]) boundary[i]! += pop;
    }
    if (
      (lo[1] && !lo[0]) ||
      (hi[1] && !hi[0]) ||
      !!(flags & 16) !== (hi[0] && !lo[0])
    )
      return null;
    if (flags & 32) {
      if (kind === 0) return null;
      exactEdges++;
    }
    totals[kind]! += pop;
  }
  const s = value.summary;
  if (
    !exactKeys(s, [
      'populationScaled',
      'lowerScaled',
      'upperScaled',
      'boundaryScaled',
      'exactEdgeCount',
      'populationTotalScaled',
      'populatedRecords',
      'rawRecords',
      'zeroRecords',
      'regularOnlyAreaKm2',
      'specialAreaKm2',
      'designatedAreaKm2',
    ]) ||
    !same(s.populationScaled, totals) ||
    !same(s.lowerScaled, lower) ||
    !same(s.upperScaled, upper) ||
    !same(s.boundaryScaled, boundary) ||
    s.exactEdgeCount !== exactEdges ||
    s.populationTotalScaled !== totals.reduce((a, b) => a + b, 0) ||
    s.populatedRecords !== value.meshes.length ||
    !integer(s.rawRecords) ||
    !integer(s.zeroRecords) ||
    s.rawRecords !== value.meshes.length + s.zeroRecords
  )
    return null;
  for (const k of ['regularOnlyAreaKm2', 'specialAreaKm2', 'designatedAreaKm2'])
    if (typeof s[k] !== 'number' || !Number.isFinite(s[k]) || s[k] < 0)
      return null;
  if (
    Math.abs(
      Number(s.regularOnlyAreaKm2) +
        Number(s.specialAreaKm2) -
        Number(s.designatedAreaKm2)
    ) > Math.max(0.00000005, Number(s.designatedAreaKm2) * 1e-9)
  )
    return null;
  if (
    !(SOURCE.designatedPrefectures as readonly string[]).includes(pref) &&
    (totals[1] !== 0 ||
      totals[2] !== 0 ||
      upper.some((v) => v !== 0) ||
      s.designatedAreaKm2 !== 0)
  )
    return null;
  if (
    [...totals, ...lower, ...upper, ...boundary, s.populationTotalScaled].some(
      (n) => !integer(n)
    )
  )
    return null;
  return value as unknown as GeoSnowPrefDetail;
}

import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisSnapshotRow,
} from './snapshot';
export function parseGeoSnowManifest(
  value: unknown
): GeoAnalysisEvidenceManifest | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'slug',
      'generatedAt',
      'definitionSha256',
      'inputs',
      'stages',
      'aggregate',
      'quality',
    ]) ||
    value.schemaVersion !== 1 ||
    value.slug !== SOURCE.slug ||
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    value.definitionSha256 !== SNOW_DESIGNATION_DEFINITION_SHA256 ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.stages) ||
    !record(value.aggregate) ||
    !record(value.quality)
  )
    return null;
  const expected = [
    ...SOURCE.populationSources.map((p) => ({
      layerId: 'ksj-population-mesh-250m',
      datasetId: 'm250r6',
      version: '24',
      key: `gis/mlit-ksj/m250r6/24/${p.areaCode.slice(0, 2)}.zip`,
      sha256: p.sha256,
      bytes: p.bytes,
      geometry: 'mesh',
      role: 'calculation-input',
      usedInCalculation: true,
    })),
    ...SOURCE.snowSources.map((p) => ({
      layerId: 'ksj-a22-snow-designation',
      datasetId: 'A22',
      version: '16',
      key: `gis/mlit-ksj/A22/16/${p.areaCode.slice(0, 2)}.zip`,
      sha256: p.sha256,
      bytes: p.bytes,
      geometry: 'polygon',
      role: 'calculation-input',
      usedInCalculation: true,
    })),
  ];
  if (!same(value.inputs, expected)) return null;
  const q = value.quality;
  if (
    !exactKeys(q, [
      'expectedAreas',
      'detailAreas',
      'conservationChecks',
      'sourceRecords',
      'derivedRecords',
      'populatedMeshes',
      'exposedMeshes',
      'maxDetailBytes',
    ]) ||
    !Object.values(q).every(integer) ||
    q.expectedAreas !== 47 ||
    q.detailAreas !== 47 ||
    q.conservationChecks !== 47 ||
    Number(q.maxDetailBytes) > 5_000_000 ||
    Number(q.maxDetailBytes) <= 0 ||
    Number(q.populatedMeshes) <= 0 ||
    q.derivedRecords !== q.populatedMeshes
  )
    return null;
  const root = SOURCE.r2Root,
    graph = [
      [
        'population-mesh',
        'source',
        'calculation-input',
        'ksj-population-mesh-250m',
      ],
      [
        'snow-designation-polygons',
        'source',
        'calculation-input',
        'ksj-a22-snow-designation',
      ],
      [
        'snow-center-point-containment',
        'spatial-operation',
        'derived',
        'population-mesh',
        'snow-designation-polygons',
      ],
      [
        'prefecture-aggregate',
        'aggregate',
        'aggregate',
        'snow-center-point-containment',
      ],
    ];
  const artifact = (x: unknown): x is Record<string, unknown> =>
    record(x) &&
    typeof x.key === 'string' &&
    typeof x.sha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(x.sha256) &&
    integer(x.bytes) &&
    x.bytes > 0 &&
    integer(x.recordCount);
  if (
    !artifact(value.aggregate) ||
    !exactKeys(value.aggregate, ['key', 'sha256', 'bytes', 'recordCount']) ||
    value.aggregate.key !== `${root}/item.json` ||
    value.aggregate.recordCount !== 47 ||
    value.stages.length !== 4
  )
    return null;
  const byKey = new Map<string, unknown>();
  let populationCount = 0,
    snowCount = 0,
    exposedMax = 0;
  for (let i = 0; i < 4; i++) {
    const s = value.stages[i],
      g = graph[i]!;
    if (
      !record(s) ||
      !exactKeys(s, [
        'id',
        'label',
        'kind',
        'role',
        'inputIds',
        'operation',
        'outputKeyPattern',
        'outputs',
      ]) ||
      s.id !== g[0] ||
      s.kind !== g[1] ||
      s.role !== g[2] ||
      !same(s.inputIds, g.slice(3)) ||
      typeof s.label !== 'string' ||
      !s.label.trim() ||
      typeof s.operation !== 'string' ||
      !s.operation.trim() ||
      !Array.isArray(s.outputs)
    )
      return null;
    if (i === 3) {
      if (
        !same(s.outputs, [value.aggregate]) ||
        s.outputKeyPattern !== `${root}/item.json`
      )
        return null;
      continue;
    }
    const dir = i === 1 ? 'source' : 'pref';
    if (
      s.outputs.length !== 47 ||
      s.outputKeyPattern !== `${root}/${dir}/{NN}.json`
    )
      return null;
    for (let n = 0; n < 47; n++) {
      const o = s.outputs[n],
        code = String(n + 1).padStart(2, '0') + '000',
        key = `${root}/${dir}/${code.slice(0, 2)}.json`;
      if (
        !artifact(o) ||
        !exactKeys(o, ['key', 'sha256', 'bytes', 'recordCount', 'areaCode']) ||
        o.areaCode !== code ||
        o.key !== key ||
        Number(o.bytes) > 5_000_000
      )
        return null;
      if (byKey.has(key) && !same(byKey.get(key), o)) return null;
      byKey.set(key, o);
      if (i === 0) populationCount += Number(o.recordCount);
      if (i === 1) snowCount += Number(o.recordCount);
      if (i === 2) exposedMax += Number(o.recordCount);
    }
  }
  if (
    populationCount !== q.populatedMeshes ||
    snowCount + populationCount !== q.sourceRecords ||
    Number(q.exposedMeshes) > exposedMax
  )
    return null;
  return value as unknown as GeoAnalysisEvidenceManifest;
}

/** Hash validation against the manifest must run before this numerical correspondence check. */
export function assertGeoSnowConservation(
  detail: GeoSnowPrefDetail,
  row: GeoAnalysisSnapshotRow
): void {
  const s = detail.summary,
    expected = {
      designatedCenterPopulation:
        (s.populationScaled[1] + s.populationScaled[2]) / 10000,
      specialCenterPopulation: s.populationScaled[2] / 10000,
      designatedCenterPopulationShare:
        ((s.populationScaled[1] + s.populationScaled[2]) * 100) /
        s.populationTotalScaled,
      designatedAreaKm2: s.designatedAreaKm2,
      specialAreaKm2: s.specialAreaKm2,
      boundaryCellPopulation: s.boundaryScaled[0] / 10000,
      population2020: s.populationTotalScaled / 10000,
    };
  if (
    row.areaCode !== detail.areaCode ||
    row.areaName !== detail.areaName ||
    !same(Object.keys(row.values).sort(), Object.keys(expected).sort()) ||
    Object.entries(expected).some(([key, value]) => row.values[key] !== value)
  )
    throw new Error('Snow detail/aggregate conservation failed');
}
