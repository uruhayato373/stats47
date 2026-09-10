import { EARTHQUAKE_EXPOSURE_SOURCE as source } from './earthquake-exposure-source';

export type EarthquakeBandKey = (typeof source.bands)[number]['key'];
export interface EarthquakePopulationCounts {
  records: number;
  population2020: number;
  population2050: number;
}
export interface EarthquakePopulationRow {
  areaCode: string;
  areaName: string;
  total: EarthquakePopulationCounts;
  bands: (EarthquakePopulationCounts & { key: EarthquakeBandKey })[];
  unmatched: EarthquakePopulationCounts & {
    notInSourceRecords: number;
    missingValueRecords: number;
  };
  coverage: { population2020Percent: number; population2050Percent: number };
}
export interface EarthquakePopulationSnapshot {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  rows: EarthquakePopulationRow[];
  national: EarthquakePopulationRow;
}
export interface EarthquakePrefArtifact {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  row: EarthquakePopulationRow;
}
export interface EarthquakeArtifactRef {
  key: string;
  sha256: string;
  bytes: number;
}
export interface EarthquakeInputEvidence {
  id: string;
  version: string;
  url: string;
  sha256: string;
  bytes: number;
  acquiredAt: string;
  bodyVisibility: 'private-original' | 'public-license-original';
}
export interface EarthquakePopulationManifest {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  kind: 'restricted-source-prefecture-aggregate';
  canonicalPath: typeof source.canonicalPath;
  operation: typeof source.algorithm;
  publicShape: 'prefecture-intensity-band-population';
  jshisOriginalPublic: false;
  inputs: EarthquakeInputEvidence[];
  intermediates: (EarthquakeArtifactRef & { areaCode: string })[];
  aggregate: EarthquakeArtifactRef;
  verification: EarthquakeArtifactRef;
  reproduction: {
    command: string;
    privateInputRequirement: string;
    populationIdentity: string;
    unmatchedPolicy: string;
  };
}
export interface EarthquakePopulationVerification {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  status: 'PASS';
  sourceFiles: 48;
  checkedPrefectures: 47;
  hazardRecords: number;
  populationRecords: number;
  uniquePopulationGridCells: number;
  crossPrefectureGridCells: number;
  unmatchedRecords: number;
  invalidPopulationValues: 0;
  duplicatePopulationIdentities: 0;
  missingHazardValues: 0;
  conservationChecks: 144;
}

const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
function requireCondition(v: unknown, message: string): asserts v {
  if (!v) throw new Error(message);
}
function object(
  v: unknown,
  allowed: readonly string[]
): asserts v is Record<string, unknown> {
  requireCondition(record(v), 'Expected object');
  requireCondition(
    Object.keys(v).length === allowed.length &&
      allowed.every((k) => Object.prototype.hasOwnProperty.call(v, k)),
    'Missing or unexpected public field'
  );
}
const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const integer = (v: unknown): v is number =>
  finite(v) && Number.isSafeInteger(v);
const timestamp = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v));
const close = (a: number, b: number) => Math.abs(a - b) <= 0.0001;
const countKeys = ['records', 'population2020', 'population2050'] as const;
const areaName = (code: string) =>
  code === '00000'
    ? '全国'
    : source.populationSources.find((s) => s.areaCode === code)?.areaName;
function counts(v: Record<string, unknown>) {
  requireCondition(
    integer(v.records) && finite(v.population2020) && finite(v.population2050),
    'Invalid population counts'
  );
}
export function assertEarthquakePopulationRow(
  value: unknown
): asserts value is EarthquakePopulationRow {
  object(value, [
    'areaCode',
    'areaName',
    'total',
    'bands',
    'unmatched',
    'coverage',
  ]);
  requireCondition(
    typeof value.areaCode === 'string' &&
      typeof value.areaName === 'string' &&
      areaName(value.areaCode) === value.areaName,
    'Wrong area identity'
  );
  object(value.total, countKeys);
  counts(value.total);
  object(value.unmatched, [
    ...countKeys,
    'notInSourceRecords',
    'missingValueRecords',
  ]);
  counts(value.unmatched);
  requireCondition(
    integer(value.unmatched.notInSourceRecords) &&
      integer(value.unmatched.missingValueRecords) &&
      value.unmatched.notInSourceRecords +
        value.unmatched.missingValueRecords ===
        value.unmatched.records,
    'Unmatched identity mismatch'
  );
  object(value.coverage, ['population2020Percent', 'population2050Percent']);
  requireCondition(
    Array.isArray(value.bands) && value.bands.length === 6,
    'Require six distinct bands'
  );
  value.bands.forEach((band, i) => {
    object(band, ['key', ...countKeys]);
    counts(band);
    requireCondition(
      band.key === source.bands[i]?.key,
      'Wrong band order or duplicate'
    );
  });
  const row = value as unknown as EarthquakePopulationRow;
  for (const key of countKeys) {
    const calculated = row.bands.reduce(
      (s, b) => s + b[key],
      row.unmatched[key]
    );
    requireCondition(
      key === 'records'
        ? calculated === row.total[key]
        : close(calculated, row.total[key]),
      'Population conservation failed'
    );
  }
  for (const year of [2020, 2050] as const) {
    const k = `population${year}` as const,
      coverageKey = `population${year}Percent` as const;
    requireCondition(
      row.total[k] > 0 &&
        finite(row.coverage[coverageKey]) &&
        row.coverage[coverageKey] <= 100,
      'Invalid coverage'
    );
    requireCondition(
      Math.abs(
        row.coverage[coverageKey] - (1 - row.unmatched[k] / row.total[k]) * 100
      ) < 1e-8,
      'Coverage uses wrong denominator'
    );
  }
}
function header(value: Record<string, unknown>) {
  requireCondition(
    value.schemaVersion === 1 &&
      value.definitionVersion === source.definitionVersion &&
      timestamp(value.generatedAt),
    'Wrong version or timestamp'
  );
}
export function assertEarthquakePopulationSnapshot(
  value: unknown
): asserts value is EarthquakePopulationSnapshot {
  object(value, [
    'schemaVersion',
    'definitionVersion',
    'generatedAt',
    'rows',
    'national',
  ]);
  header(value);
  requireCondition(
    Array.isArray(value.rows) && value.rows.length === 47,
    'Require 47 prefectures'
  );
  const codes = new Set<string>();
  for (const row of value.rows) {
    assertEarthquakePopulationRow(row);
    requireCondition(
      row.areaCode !== '00000' && !codes.has(row.areaCode),
      'Duplicate or national prefecture'
    );
    codes.add(row.areaCode);
  }
  assertEarthquakePopulationRow(value.national);
  requireCondition(
    value.national.areaCode === '00000',
    'Missing national total'
  );
  const snapshot = value as unknown as EarthquakePopulationSnapshot;
  for (const k of countKeys) {
    for (const get of [
      (r: EarthquakePopulationRow) => r.total[k],
      (r: EarthquakePopulationRow) => r.unmatched[k],
      ...source.bands.map(
        (_, i) => (r: EarthquakePopulationRow) => r.bands[i]![k]
      ),
    ]) {
      const sum = snapshot.rows.reduce((s, r) => s + get(r), 0),
        n = get(snapshot.national);
      requireCondition(
        k === 'records' ? sum === n : close(sum, n),
        'National total is not sum of prefectures'
      );
    }
  }
  requireCondition(
    snapshot.national.total.records ===
      source.expectedCounts.populationRecords &&
      snapshot.national.unmatched.records ===
        source.expectedCounts.unmatchedRecords,
    'Pinned input/coverage counts changed'
  );
  for (const k of ['notInSourceRecords', 'missingValueRecords'] as const)
    requireCondition(
      snapshot.rows.reduce((s, r) => s + r.unmatched[k], 0) ===
        snapshot.national.unmatched[k],
      'National unmatched reason count differs'
    );
}
export function parseEarthquakePopulationSnapshot(
  value: unknown
): EarthquakePopulationSnapshot | null {
  try {
    assertEarthquakePopulationSnapshot(value);
    return value;
  } catch {
    return null;
  }
}
export function assertEarthquakePrefArtifact(
  value: unknown,
  code: string
): asserts value is EarthquakePrefArtifact {
  object(value, ['schemaVersion', 'definitionVersion', 'generatedAt', 'row']);
  header(value);
  assertEarthquakePopulationRow(value.row);
  requireCondition(
    value.row.areaCode === code && code !== '00000',
    'Wrong intermediate area'
  );
}
export function buildEarthquakePrefArtifact(
  snapshot: EarthquakePopulationSnapshot,
  row: EarthquakePopulationRow
): EarthquakePrefArtifact {
  return {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt: snapshot.generatedAt,
    row,
  };
}
function artifact(value: unknown, expectedKey: string) {
  object(value, ['key', 'sha256', 'bytes']);
  requireCondition(
    value.key === expectedKey &&
      typeof value.sha256 === 'string' &&
      /^[a-f0-9]{64}$/.test(value.sha256) &&
      integer(value.bytes) &&
      value.bytes > 0 &&
      value.bytes <= 5_000_000,
    'Invalid public artifact'
  );
}
export function assertEarthquakeManifest(
  value: unknown
): asserts value is EarthquakePopulationManifest {
  object(value, [
    'schemaVersion',
    'definitionVersion',
    'generatedAt',
    'kind',
    'canonicalPath',
    'operation',
    'publicShape',
    'jshisOriginalPublic',
    'inputs',
    'intermediates',
    'aggregate',
    'verification',
    'reproduction',
  ]);
  header(value);
  requireCondition(
    value.kind === 'restricted-source-prefecture-aggregate' &&
      value.canonicalPath === source.canonicalPath &&
      value.operation === source.algorithm &&
      value.publicShape === 'prefecture-intensity-band-population' &&
      value.jshisOriginalPublic === false,
    'Wrong public contract'
  );
  requireCondition(
    Array.isArray(value.inputs) && value.inputs.length === 48,
    'Missing original source'
  );
  const pins = [source.hazard, ...source.populationSources];
  const ids = new Set<string>();
  for (const input of value.inputs) {
    object(input, [
      'id',
      'version',
      'url',
      'sha256',
      'bytes',
      'acquiredAt',
      'bodyVisibility',
    ]);
    const pin = pins.find((p) => p.id === input.id);
    requireCondition(
      pin &&
        input.version === pin.version &&
        input.url === pin.url &&
        input.sha256 === pin.sha256 &&
        input.bytes === pin.bytes &&
        timestamp(input.acquiredAt),
      'Input is not exact pinned official source'
    );
    requireCondition(
      Date.parse(input.acquiredAt) <= Date.parse(String(value.generatedAt)),
      'Acquisition date follows generation'
    );
    requireCondition(
      input.bodyVisibility ===
        (pin.id === source.hazard.id
          ? 'private-original'
          : 'public-license-original') && !ids.has(pin.id),
      'Private provider policy or duplicate source'
    );
    ids.add(pin.id);
  }
  requireCondition(
    Array.isArray(value.intermediates) && value.intermediates.length === 47,
    'Missing prefecture intermediate'
  );
  const areas = new Set<string>();
  for (const ref of value.intermediates) {
    object(ref, ['areaCode', 'key', 'sha256', 'bytes']);
    requireCondition(
      typeof ref.areaCode === 'string' &&
        ref.areaCode !== '00000' &&
        areaName(ref.areaCode) &&
        !areas.has(ref.areaCode),
      'Duplicate intermediate'
    );
    areas.add(ref.areaCode);
    artifact(
      { key: ref.key, sha256: ref.sha256, bytes: ref.bytes },
      `${source.r2Root}/pref/${ref.areaCode.slice(0, 2)}.json`
    );
  }
  artifact(value.aggregate, `${source.r2Root}/item.json`);
  artifact(value.verification, `${source.r2Root}/verification.json`);
  object(value.reproduction, [
    'command',
    'privateInputRequirement',
    'populationIdentity',
    'unmatchedPolicy',
  ]);
  requireCondition(
    value.reproduction.command ===
      'node --import tsx .claude/scripts/themes/ingest-earthquake-exposure.mjs --source-dir <PRIVATE_INPUT_DIR> --private-work-dir <PRIVATE_WORK_DIR> --write-local' &&
      value.reproduction.privateInputRequirement ===
        'J-SHIS original ZIP and joined mesh rows remain outside public R2' &&
      value.reproduction.populationIdentity ===
        'prefecture+SHICODE+MESH_ID; many-to-one hazard join' &&
      value.reproduction.unmatchedPolicy ===
        'preserve separately; never classify as intensity zero',
    'Invalid reproducibility contract'
  );
}
export function parseEarthquakeManifest(
  value: unknown
): EarthquakePopulationManifest | null {
  try {
    assertEarthquakeManifest(value);
    return value;
  } catch {
    return null;
  }
}
export function assertEarthquakeVerification(
  value: unknown
): asserts value is EarthquakePopulationVerification {
  object(value, [
    'schemaVersion',
    'definitionVersion',
    'generatedAt',
    'status',
    'sourceFiles',
    'checkedPrefectures',
    'hazardRecords',
    'populationRecords',
    'uniquePopulationGridCells',
    'crossPrefectureGridCells',
    'unmatchedRecords',
    'invalidPopulationValues',
    'duplicatePopulationIdentities',
    'missingHazardValues',
    'conservationChecks',
  ]);
  header(value);
  requireCondition(
    value.status === 'PASS' &&
      value.sourceFiles === 48 &&
      value.checkedPrefectures === 47 &&
      value.invalidPopulationValues === 0 &&
      value.duplicatePopulationIdentities === 0 &&
      value.missingHazardValues === 0 &&
      value.conservationChecks === 144,
    'Verification incomplete'
  );
  for (const [key, expected] of Object.entries(source.expectedCounts))
    requireCondition(value[key] === expected, 'Verification count changed');
}
export function selectEarthquakePopulationRow(
  snapshot: EarthquakePopulationSnapshot,
  areaCode: string | null
): EarthquakePopulationRow | null {
  return areaCode
    ? (snapshot.rows.find((r) => r.areaCode === areaCode) ?? null)
    : snapshot.national;
}
