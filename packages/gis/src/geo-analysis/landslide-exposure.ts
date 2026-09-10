import { LANDSLIDE_EXPOSURE_SOURCE as S } from '../../../data-configs/src/theme-catalog/landslide-exposure-source';
import {
  LANDSLIDE_EXPOSURE_DEFINITION as D,
  LANDSLIDE_EXPOSURE_DEFINITION_SHA256,
} from './landslide-exposure-definition';
import { PUBLIC_FACILITY_INPUTS } from './public-facility-inputs';
import { snowMeshBounds } from './snow-designation';
import type {
  GeoAnalysisSnapshot,
  GeoAnalysisSnapshotRow,
  GeoAnalysisEvidenceManifest,
} from './snapshot';
export type GeoLandslideMesh = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
];
export type GeoLandslideFacility = readonly [
  string,
  string,
  number,
  string,
  number,
  number,
  number,
];
export interface GeoLandslideCounts {
  totalScaled: number;
  exclusiveScaled: [number, number, number];
  warningScaled: number;
  specialScaled: number;
  redOutsideWarningScaled: number;
  phenomenonScaled: [number, number, number];
  warningPhenomenonScaled: [number, number, number];
  specialPhenomenonScaled: [number, number, number];
  lowerScaled: number;
  upperScaled: number;
  boundaryScaled: number;
  exposedRecords: number;
  records: number;
}
export interface GeoLandslideSummary extends GeoLandslideCounts {
  zeroRecords: number;
  rawRecords: number;
  crossSourcePrefectureRecords: number;
  facilities: {
    administrative: GeoLandslideCounts;
    meeting: GeoLandslideCounts;
  };
}
type Base = {
  schemaVersion: 1;
  slug: typeof S.slug;
  dataVersion: typeof S.dataVersion;
  generatedAt: string;
  areaCode: string;
  areaName: string;
};
export type GeoLandslidePrefDetail = Base &
  (
    | {
        status: 'available';
        populationScale: 10000;
        meshes: readonly GeoLandslideMesh[];
        facilities: readonly GeoLandslideFacility[];
        summary: GeoLandslideSummary;
      }
    | {
        status: 'excluded-commercial-restriction';
        reason: string;
        meshes: readonly [];
        facilities: readonly [];
        summary: null;
      }
  );
export const landslideMeshBounds = snowMeshBounds;
const rec = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const integer = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const text = (x: unknown): x is string =>
  typeof x === 'string' && x.trim().length > 0;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const keys = (x: Record<string, unknown>, ks: readonly string[]) =>
  Object.keys(x).length === ks.length && ks.every((k) => k in x);
const timestamp = (x: unknown) =>
  text(x) && /^\d{4}-\d\d-\d\dT/.test(x) && Number.isFinite(Date.parse(x));
export function landslideCounts(
  rows: readonly (readonly [number, number, number, number])[]
): GeoLandslideCounts {
  const s: GeoLandslideCounts = {
    totalScaled: 0,
    exclusiveScaled: [0, 0, 0],
    warningScaled: 0,
    specialScaled: 0,
    redOutsideWarningScaled: 0,
    phenomenonScaled: [0, 0, 0],
    warningPhenomenonScaled: [0, 0, 0],
    specialPhenomenonScaled: [0, 0, 0],
    lowerScaled: 0,
    upperScaled: 0,
    boundaryScaled: 0,
    exposedRecords: 0,
    records: rows.length,
  };
  for (const [n, m, l, u] of rows) {
    s.totalScaled += n;
    s.exclusiveScaled[m & 56 ? 2 : m ? 1 : 0] += n;
    if (m & 7) s.warningScaled += n;
    if (m & 56) s.specialScaled += n;
    if (m & 56 && !(m & 7)) s.redOutsideWarningScaled += n;
    for (let i = 0; i < 3; i++) {
      if (m & (9 << i)) s.phenomenonScaled[i]! += n;
      if (m & (1 << i)) s.warningPhenomenonScaled[i]! += n;
      if (m & (8 << i)) s.specialPhenomenonScaled[i]! += n;
    }
    if (l) s.lowerScaled += n;
    if (u) s.upperScaled += n;
    if (u && !l) s.boundaryScaled += n;
    if (m) s.exposedRecords++;
  }
  return s;
}
const equalCounts = (x: unknown, expected: GeoLandslideCounts) =>
  rec(x) &&
  keys(x, Object.keys(expected)) &&
  Object.entries(expected).every(([k, v]) => same(x[k], v));
export function parseGeoLandslidePrefDetail(
  x: unknown,
  areaCode: string
): GeoLandslidePrefDetail | null {
  const pin = S.populationSources.find((p) => p.areaCode === areaCode);
  if (
    !pin ||
    !rec(x) ||
    x.schemaVersion !== 1 ||
    x.slug !== S.slug ||
    x.dataVersion !== S.dataVersion ||
    !timestamp(x.generatedAt) ||
    x.areaCode !== areaCode ||
    x.areaName !== pin.areaName ||
    !Array.isArray(x.meshes) ||
    !Array.isArray(x.facilities)
  )
    return null;
  const common = [
    'schemaVersion',
    'slug',
    'dataVersion',
    'generatedAt',
    'areaCode',
    'areaName',
    'status',
    'meshes',
    'facilities',
    'summary',
  ];
  if (areaCode === '26000')
    return keys(x, [...common, 'reason']) &&
      x.status === 'excluded-commercial-restriction' &&
      text(x.reason) &&
      x.summary === null &&
      x.meshes.length === 0 &&
      x.facilities.length === 0
      ? (x as unknown as GeoLandslidePrefDetail)
      : null;
  if (
    !keys(x, [...common, 'populationScale']) ||
    x.status !== 'available' ||
    x.populationScale !== 10000 ||
    !rec(x.summary) ||
    !x.meshes.length
  )
    return null;
  const pref = areaCode.slice(0, 2),
    ids = new Set<string>(),
    cells: [number, number, number, number][] = [];
  for (const row of x.meshes) {
    if (
      !Array.isArray(row) ||
      row.length !== 6 ||
      !row.every(integer) ||
      !landslideMeshBounds(row[0]) ||
      row[2] <= 0 ||
      row.slice(3).some((n) => n > 63)
    )
      return null;
    const city = String(row[1]).padStart(5, '0'),
      id = `${city}:${row[0]}`;
    if (
      city.length !== 5 ||
      !city.startsWith(pref) ||
      ids.has(id) ||
      (row[4] & ~row[3]) !== 0 ||
      (row[3] & ~row[5]) !== 0
    )
      return null;
    ids.add(id);
    cells.push([row[2], row[3], row[4], row[5]]);
  }
  const expected = landslideCounts(cells),
    s = x.summary,
    groups: {
      administrative: [number, number, number, number][];
      meeting: [number, number, number, number][];
    } = { administrative: [], meeting: [] };
  const fids = new Set<string>();
  for (const f of x.facilities) {
    if (
      !Array.isArray(f) ||
      f.length !== 7 ||
      !text(f[0]) ||
      !text(f[1]) ||
      !f[1].startsWith(pref) ||
      f[1].length !== 5 ||
      !integer(f[2]) ||
      f[2] < 1 ||
      f[2] > 5 ||
      typeof f[3] !== 'string' ||
      typeof f[4] !== 'number' ||
      typeof f[5] !== 'number' ||
      !(122 < f[4] && f[4] < 154 && 20 < f[5] && f[5] < 46) ||
      !integer(f[6]) ||
      f[6] > 63 ||
      fids.has(f[0]) ||
      !f[0].startsWith(`P05-22:${pref}:`)
    )
      return null;
    fids.add(f[0]);
    groups[f[2] <= 3 ? 'administrative' : 'meeting'].push([
      1,
      f[6],
      f[6],
      f[6],
    ]);
  }
  if (
    !keys(s, [
      ...Object.keys(expected),
      'zeroRecords',
      'rawRecords',
      'crossSourcePrefectureRecords',
      'facilities',
    ]) ||
    !Object.entries(expected).every(([k, v]) => same(s[k], v)) ||
    s.totalScaled !== pin.populationScaled ||
    s.records !== pin.populatedRecords ||
    s.zeroRecords !== pin.zeroRecords ||
    s.rawRecords !== pin.populatedRecords + pin.zeroRecords ||
    !integer(s.crossSourcePrefectureRecords) ||
    s.crossSourcePrefectureRecords > expected.records ||
    !rec(s.facilities) ||
    !keys(s.facilities, ['administrative', 'meeting'])
  )
    return null;
  for (const g of ['administrative', 'meeting'] as const)
    if (!equalCounts(s.facilities[g], landslideCounts(groups[g]))) return null;
  return x as unknown as GeoLandslidePrefDetail;
}
export function landslideValues(
  s: GeoLandslideSummary | null
): Record<string, number | null> {
  if (!s)
    return D.metrics.reduce<Record<string, number | null>>((v, m) => {
      v[m.key] = null;
      return v;
    }, {});
  const exposed = s.exclusiveScaled[1] + s.exclusiveScaled[2],
    a = s.facilities.administrative,
    m = s.facilities.meeting;
  return {
    exposedCenterPopulation: exposed / 10000,
    warningCenterPopulation: s.warningScaled / 10000,
    specialCenterPopulation: s.specialScaled / 10000,
    exposedCenterPopulationShare:
      (exposed / 10000 / (s.totalScaled / 10000)) * 100,
    population2020: s.totalScaled / 10000,
    exposedAdministrativeFacilities: a.exposedRecords,
    administrativeFacilities: a.records,
    exposedMeetingFacilities: m.exposedRecords,
    meetingFacilities: m.records,
  };
}
export function landslideNationalValues(
  rows: readonly GeoAnalysisSnapshotRow[]
): Record<string, number> {
  if (
    rows.length !== 47 ||
    new Set(rows.map((r) => r.areaCode)).size !== 47 ||
    !S.populationSources.every((p) =>
      rows.some((r) => r.areaCode === p.areaCode)
    ) ||
    Object.values(rows.find((r) => r.areaCode === '26000')!.values).some(
      (v) => v !== null
    )
  )
    throw new Error('landslide national coverage');
  const result: Record<string, number> = {};
  for (const m of D.metrics) {
    if (m.unit === '%') continue;
    const scale = m.unit === '人' ? 10000 : 1;
    result[m.key] =
      rows
        .filter((r) => r.areaCode !== '26000')
        .reduce((sum, r) => {
          const v = r.values[m.key];
          if (typeof v !== 'number' || !Number.isFinite(v))
            throw new Error('missing eligible value');
          return sum + Math.round(v * scale);
        }, 0) / scale;
  }
  result.exposedCenterPopulationShare =
    (result.exposedCenterPopulation! / result.population2020!) * 100;
  return result;
}
export function assertGeoLandslideConservation(
  d: GeoLandslidePrefDetail,
  r: GeoAnalysisSnapshotRow
): void {
  if (
    d.areaCode !== r.areaCode ||
    d.areaName !== r.areaName ||
    !same(landslideValues(d.summary), r.values)
  )
    throw new Error('landslide aggregate/detail mismatch');
}
export function parseGeoLandslideSnapshot(
  x: unknown
): GeoAnalysisSnapshot | null {
  if (
    !rec(x) ||
    !keys(x, [
      ...Object.keys(D),
      'generatedAt',
      'rows',
      'summary',
      'dataQuality',
    ]) ||
    !timestamp(x.generatedAt) ||
    !Object.entries(D).every(([k, v]) => same(x[k], v)) ||
    !Array.isArray(x.rows) ||
    x.rows.length !== 47 ||
    !rec(x.summary) ||
    !rec(x.dataQuality)
  )
    return null;
  const codes = new Set<string>(),
    values: number[] = [],
    ranks = new Set<number>();
  for (const [index, r] of x.rows.entries()) {
    if (
      !rec(r) ||
      !keys(r, ['areaCode', 'areaName', 'rank', 'values']) ||
      typeof r.areaCode !== 'string' ||
      codes.has(r.areaCode) ||
      !integer(r.rank) ||
      r.rank !== index + 1 ||
      r.rank > 47 ||
      ranks.has(r.rank) ||
      !rec(r.values) ||
      !keys(
        r.values,
        D.metrics.map((m) => m.key)
      )
    )
      return null;
    const pin = S.populationSources.find((p) => p.areaCode === r.areaCode);
    if (!pin || r.areaName !== pin.areaName) return null;
    codes.add(r.areaCode);
    ranks.add(r.rank);
    if (r.areaCode === '26000') {
      if (Object.values(r.values).some((v) => v !== null) || r.rank !== 47)
        return null;
      continue;
    }
    if (
      !Object.values(r.values).every(
        (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
      )
    )
      return null;
    const v = r.values as Record<string, number>;
    if (
      v.population2020 !== pin.populationScaled / 10000 ||
      v.exposedCenterPopulation! > v.population2020! ||
      v.warningCenterPopulation! > v.exposedCenterPopulation! ||
      v.specialCenterPopulation! > v.exposedCenterPopulation! ||
      v.exposedCenterPopulationShare !==
        (v.exposedCenterPopulation! / v.population2020!) * 100 ||
      v.exposedAdministrativeFacilities! > v.administrativeFacilities! ||
      v.exposedMeetingFacilities! > v.meetingFacilities!
    )
      return null;
    values.push(v.exposedCenterPopulationShare!);
  }
  values.sort((a, b) => a - b);
  const q = x.dataQuality;
  const observed = x.rows.filter((r) => r.areaCode !== '26000');
  if (
    !keys(x.summary, [
      'observationCount',
      'medianValue',
      'topAreaCodes',
      'bottomAreaCodes',
    ]) ||
    !same(
      x.summary.topAreaCodes,
      observed.slice(0, 3).map((r) => r.areaCode)
    ) ||
    !same(
      x.summary.bottomAreaCodes,
      observed.slice(-3).map((r) => r.areaCode)
    ) ||
    observed.some(
      (r, i) =>
        i > 0 &&
        Number(observed[i - 1].values.exposedCenterPopulationShare) <
          Number(r.values.exposedCenterPopulationShare)
    )
  )
    return null;
  if (
    x.summary.observationCount !== 46 ||
    x.summary.medianValue !== (values[22]! + values[23]!) / 2 ||
    q.expectedAreas !== 47 ||
    q.actualAreas !== 47 ||
    !same(q.missingAreaCodes, ['26000']) ||
    !text(q.coverageNote)
  )
    return null;
  return x as unknown as GeoAnalysisSnapshot;
}
export function expectedLandslideInputs() {
  const hazards: Array<Record<string, string | number | boolean>> = [];
  for (const p of S.prefectures)
    if ('sha256' in p)
      hazards.push({
        layerId: 'ksj-a33-landslide-polygons',
        datasetId: 'A33',
        version: '25',
        key: `gis/mlit-ksj/A33/25/${p.areaCode.slice(0, 2)}.zip`,
        sha256: p.sha256,
        bytes: p.bytes,
        geometry: 'polygon',
        role: 'calculation-input',
        usedInCalculation: true,
      });
  return [
    ...S.populationSources.map((p) => ({
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
    ...PUBLIC_FACILITY_INPUTS.map((p) => ({
      layerId: 'ksj-p05-public-facility-point',
      datasetId: 'P05',
      version: '22',
      key: `gis/mlit-ksj/P05/22/${p.pref}.geojson`,
      sha256: p.facilities.sha256,
      bytes: p.facilities.bytes,
      geometry: 'point',
      role: 'calculation-input',
      usedInCalculation: true,
    })),
    ...hazards,
  ];
}
const artifact = (x: unknown): x is Record<string, unknown> =>
  rec(x) &&
  text(x.key) &&
  !x.key.includes('..') &&
  !/[?#\\]/.test(x.key) &&
  typeof x.sha256 === 'string' &&
  /^[a-f0-9]{64}$/.test(x.sha256) &&
  integer(x.bytes) &&
  x.bytes > 0 &&
  integer(x.recordCount);
export const LANDSLIDE_STAGES = [
  [
    'population-mesh',
    'source',
    'calculation-input',
    'ksj-population-mesh-250m',
  ],
  [
    'public-facility-points',
    'source',
    'calculation-input',
    'ksj-p05-public-facility-point',
  ],
  [
    'landslide-polygons',
    'source',
    'calculation-input',
    'ksj-a33-landslide-polygons',
  ],
  [
    'landslide-containment',
    'spatial-operation',
    'derived',
    'population-mesh',
    'public-facility-points',
    'landslide-polygons',
  ],
  ['prefecture-aggregate', 'aggregate', 'aggregate', 'landslide-containment'],
] as const;
export function parseGeoLandslideManifest(
  x: unknown
): GeoAnalysisEvidenceManifest | null {
  if (
    !rec(x) ||
    !keys(x, [
      'schemaVersion',
      'slug',
      'generatedAt',
      'definitionSha256',
      'inputs',
      'stages',
      'aggregate',
      'quality',
    ]) ||
    x.schemaVersion !== 1 ||
    x.slug !== S.slug ||
    !timestamp(x.generatedAt) ||
    x.definitionSha256 !== LANDSLIDE_EXPOSURE_DEFINITION_SHA256 ||
    !same(x.inputs, expectedLandslideInputs()) ||
    !Array.isArray(x.stages) ||
    x.stages.length !== LANDSLIDE_STAGES.length ||
    !artifact(x.aggregate) ||
    x.aggregate.key !== `${S.r2Root}/item.json` ||
    x.aggregate.recordCount !== 47 ||
    !rec(x.quality)
  )
    return null;
  const q = x.quality;
  if (
    !Object.values(q).every(integer) ||
    q.expectedAreas !== 47 ||
    q.detailAreas !== 47 ||
    q.conservationChecks !== 46 ||
    !integer(q.maxDetailBytes) ||
    q.maxDetailBytes > 5000000
  )
    return null;
  for (let i = 0; i < LANDSLIDE_STAGES.length; i++) {
    const s = x.stages[i],
      g = LANDSLIDE_STAGES[i]!;
    if (
      !rec(s) ||
      !keys(s, [
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
      !text(s.label) ||
      !text(s.operation) ||
      !Array.isArray(s.outputs) ||
      !s.outputs.every(artifact) ||
      new Set(s.outputs.map((o) => o.key)).size !== s.outputs.length
    )
      return null;
    const expectedPattern =
      i === 4
        ? `${S.r2Root}/item.json`
        : `${S.r2Root}/${i === 1 ? 'facilities' : i === 2 ? 'source' : 'pref'}/{prefCode}.json`;
    if (s.outputKeyPattern !== expectedPattern) return null;
    if (i === 4) {
      if (!same(s.outputs, [x.aggregate])) return null;
      continue;
    }
    const dir = i === 1 ? 'facilities' : i === 2 ? 'source' : 'pref',
      indexes = s.outputs.filter((o) =>
        /^\d\d\.json$/.test(String(o.key).split('/').slice(-1)[0]!)
      );
    if (
      indexes.length !== 47 ||
      !S.populationSources.every((p) =>
        indexes.some(
          (o) =>
            o.key === `${S.r2Root}/${dir}/${p.areaCode.slice(0, 2)}.json` &&
            o.areaCode === p.areaCode
        )
      )
    )
      return null;
    if (i !== 2 && s.outputs.length !== 47) return null;
    for (const o of s.outputs)
      if (
        Number(o.bytes) > 5000000 ||
        typeof o.key !== 'string' ||
        !o.key.startsWith(`${S.r2Root}/${dir}/`)
      )
        return null;
    if (
      i === 2 &&
      s.outputs.some(
        (o) =>
          /\d\d-\d{3}\.json$/.test(String(o.key)) &&
          !S.availableAreaCodes.some(
            (c) =>
              String(o.key).startsWith(
                `${S.r2Root}/source/${c.slice(0, 2)}-`
              ) && o.areaCode === c
          )
      )
    )
      return null;
    if (
      i === 2 &&
      !s.outputs.some((o) => o.key === `${S.r2Root}/source/index.json`)
    )
      return null;
    if (
      i === 2 &&
      s.outputs.some(
        (o) =>
          !new RegExp(
            `^${S.r2Root}/source/(?:index|\\d\\d|(?:0[1-9]|1[0-9]|2[0-57-9]|[34][0-9])-\\d{3})\\.json$`
          ).test(String(o.key))
      )
    )
      return null;
  }
  return x as unknown as GeoAnalysisEvidenceManifest;
}
/** A33-wide partial license stays blocked. This check only approves pinned, attributable version-25 pref archives. */
export function assertLandslideSourcePublication(
  pref: string,
  sourceSha: string,
  permissionSha: string
): void {
  const p = S.prefectures.find((p) => p.areaCode === pref + '000');
  if (
    !p ||
    p.areaCode === '26000' ||
    !('sha256' in p) ||
    p.sha256 !== sourceSha ||
    p.publication !== 'allowed-with-attribution' ||
    permissionSha !== S.a33.permissions.sha256
  )
    throw new Error('unapproved A33 publication scope');
}
