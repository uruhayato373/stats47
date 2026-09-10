import { TSUNAMI_EXPOSURE_SOURCE as source } from './tsunami-exposure-source';
export type TsunamiBandKey = string;
export function tsunamiBands(
  areaCode: string
): readonly { key: string; label: string }[] {
  const scenario = source.scenarios.find((s) => s.areaCode === areaCode);
  if (!scenario) throw new Error('Unapproved county');
  return scenario.bands;
}
export interface TsunamiCounts {
  populationRecords: number;
  population2020Units: number;
  population2050Units: number;
  administrativeFacilities: number;
  publicMeetingFacilities: number;
}
export interface TsunamiCountyRow {
  areaCode: string;
  areaName: string;
  scenarioKey: string;
  bands: (TsunamiCounts & { key: TsunamiBandKey })[];
  total: TsunamiCounts;
}
export interface TsunamiSnapshot {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  rows: TsunamiCountyRow[];
}
export interface TsunamiRef {
  key: string;
  sha256: string;
  bytes: number;
}
export interface TsunamiManifest {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  publicationContract: typeof source.publicationContract;
  canonicalPath: typeof source.canonicalPath;
  inputs: typeof source.inputs;
  evidence: typeof source.evidence;
  scenarios: typeof source.scenarios;
  aggregate: TsunamiRef;
  verification: TsunamiRef;
  intermediates: (TsunamiRef & { areaCode: string })[];
  reproduction: {
    command: string;
    populationIdentity: string;
    overlapPolicy: string;
    unavailablePolicy: string;
  };
}
export const TSUNAMI_COUNT_KEYS = [
  'populationRecords',
  'population2020Units',
  'population2050Units',
  'administrativeFacilities',
  'publicMeetingFacilities',
] as const;
function demand(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function object(
  value: unknown,
  keys: readonly string[]
): asserts value is Record<string, unknown> {
  demand(
    !!value && typeof value === 'object' && !Array.isArray(value),
    'Expected object'
  );
  demand(
    Object.keys(value).length === keys.length &&
      keys.every((k) => Object.prototype.hasOwnProperty.call(value, k)),
    'Missing or unexpected field'
  );
}
function count(value: unknown): asserts value is number {
  demand(
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0,
    'Invalid count'
  );
}
function timestamp(value: unknown): asserts value is string {
  demand(
    typeof value === 'string' && Number.isFinite(Date.parse(value)),
    'Invalid date'
  );
}
function counts(value: unknown, band = false): asserts value is TsunamiCounts {
  object(value, band ? ['key', ...TSUNAMI_COUNT_KEYS] : TSUNAMI_COUNT_KEYS);
  for (const k of TSUNAMI_COUNT_KEYS) count(value[k]);
}
export function assertTsunamiCountyRow(
  value: unknown
): asserts value is TsunamiCountyRow {
  object(value, ['areaCode', 'areaName', 'scenarioKey', 'bands', 'total']);
  const scenario = source.scenarios.find((s) => s.areaCode === value.areaCode);
  demand(
    scenario && value.scenarioKey === scenario.key,
    'County or scenario mismatch'
  );
  demand(
    source.coverage.find((a) => a.areaCode === value.areaCode)?.areaName ===
      value.areaName,
    'County name mismatch'
  );
  demand(
    Array.isArray(value.bands) && value.bands.length === scenario.bands.length,
    'Expected exact county-native bands and coverage classes'
  );
  for (const [i, b] of value.bands.entries()) {
    counts(b, true);
    demand(
      (b as TsunamiCounts & { key: string }).key === scenario.bands[i].key,
      'Wrong or duplicate band'
    );
  }
  counts(value.total);
  for (const k of TSUNAMI_COUNT_KEYS)
    demand(
      value.bands.reduce((sum, b) => sum + (b as TsunamiCounts)[k], 0) ===
        value.total[k],
      `Conservation ${k}`
    );
  demand(
    value.total.populationRecords > 0 && value.total.population2020Units > 0,
    'Empty population'
  );
}
export function assertTsunamiSnapshot(
  value: unknown
): asserts value is TsunamiSnapshot {
  object(value, ['schemaVersion', 'definitionVersion', 'generatedAt', 'rows']);
  demand(
    value.schemaVersion === 1 &&
      value.definitionVersion === source.definitionVersion,
    'Wrong version'
  );
  timestamp(value.generatedAt);
  demand(
    Array.isArray(value.rows) && value.rows.length === source.scenarios.length,
    'Wrong adopted county set'
  );
  value.rows.forEach((row, i) => {
    assertTsunamiCountyRow(row);
    demand(
      row.areaCode === source.scenarios[i].areaCode,
      'Duplicate or reordered county'
    );
  });
}
function ref(
  value: unknown,
  key: string,
  extras: readonly string[] = []
): asserts value is TsunamiRef {
  object(value, ['key', 'sha256', 'bytes', ...extras]);
  demand(value.key === key, 'Wrong artifact key');
  demand(
    typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.sha256),
    'Invalid SHA'
  );
  count(value.bytes);
  demand(value.bytes > 0 && value.bytes < 30_000_000, 'Artifact size');
}
export function assertTsunamiManifest(
  value: unknown
): asserts value is TsunamiManifest {
  object(value, [
    'schemaVersion',
    'definitionVersion',
    'generatedAt',
    'publicationContract',
    'canonicalPath',
    'inputs',
    'evidence',
    'scenarios',
    'aggregate',
    'verification',
    'intermediates',
    'reproduction',
  ]);
  demand(
    value.schemaVersion === 1 &&
      value.definitionVersion === source.definitionVersion,
    'Wrong manifest version'
  );
  timestamp(value.generatedAt);
  for (const input of source.inputs) {
    if (input.kind !== 'hazard') continue;
    demand(
      input.redistributionAllowed === true && input.licenseEvidence.length > 0,
      'Hazard redistribution is not approved'
    );
    for (const receipt of input.licenseEvidence) {
      demand(
        source.evidence.some(
          (e) => e.url === receipt.url && e.sha256 === receipt.sha256
        ),
        'Hazard rights receipt is missing'
      );
    }
  }
  demand(
    value.publicationContract === source.publicationContract &&
      value.canonicalPath === source.canonicalPath,
    'Wrong public contract'
  );
  demand(
    JSON.stringify(value.inputs) === JSON.stringify(source.inputs),
    'Unapproved source set, license or source body'
  );
  demand(
    JSON.stringify(value.evidence) === JSON.stringify(source.evidence),
    'Source rights and scenario evidence mismatch'
  );
  demand(
    JSON.stringify(value.scenarios) === JSON.stringify(source.scenarios),
    'Scenario years, models, native bands or coverage changed'
  );
  ref(value.aggregate, `${source.r2Root}/item.json`);
  ref(value.verification, `${source.r2Root}/verification.json`);
  demand(
    Array.isArray(value.intermediates) &&
      value.intermediates.length === source.scenarios.length,
    'Wrong intermediate set'
  );
  value.intermediates.forEach((r, i) => {
    ref(
      r,
      `${source.r2Root}/pref/${source.scenarios[i].areaCode.slice(0, 2)}.json`,
      ['areaCode']
    );
    demand(
      (r as TsunamiRef & { areaCode: string }).areaCode ===
        source.scenarios[i].areaCode,
      'Intermediate county'
    );
    demand(
      r.sha256 === source.expectedIntermediates[i].sha256 &&
        r.bytes === source.expectedIntermediates[i].bytes,
      'Intermediate bytes differ from verified source output'
    );
  });
  object(value.reproduction, [
    'command',
    'populationIdentity',
    'overlapPolicy',
    'unavailablePolicy',
  ]);
  for (const v of Object.values(value.reproduction))
    demand(typeof v === 'string' && v.length > 0, 'Missing reproduction');
}
export function selectTsunamiCounty(
  snapshot: TsunamiSnapshot,
  areaCode: string | null
): TsunamiCountyRow | null {
  return areaCode
    ? (snapshot.rows.find((r) => r.areaCode === areaCode) ?? null)
    : null;
}
export function tsunamiCoverage(areaCode: string | null) {
  return areaCode
    ? (source.coverage.find((a) => a.areaCode === areaCode) ?? null)
    : null;
}
export function tsunamiPopulation(units: number): number {
  return units / source.populationScale;
}
export async function tsunamiSha(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, '0')
  ).join('');
}
export async function verifyTsunamiSnapshot(
  value: unknown
): Promise<TsunamiSnapshot> {
  assertTsunamiSnapshot(value);
  demand(
    (await tsunamiSha(JSON.stringify(value.rows))) ===
      source.expectedCountyFactsSha256,
    'County facts differ from original-verified output'
  );
  return value;
}
export interface TsunamiVerification {
  schemaVersion: 1;
  definitionVersion: typeof source.definitionVersion;
  generatedAt: string;
  status: 'PASS';
  checkedCounties: number;
  unavailableCounties: number;
  countyChecks: {
    areaCode: string;
    populationRecords: number;
    facilityRecords: number;
    hazardRecords: number;
    conservationChecks: 5;
  }[];
}
export function assertTsunamiVerification(
  value: unknown,
  snapshot: TsunamiSnapshot
): asserts value is TsunamiVerification {
  object(value, [
    'schemaVersion',
    'definitionVersion',
    'generatedAt',
    'status',
    'checkedCounties',
    'unavailableCounties',
    'countyChecks',
  ]);
  demand(
    value.schemaVersion === 1 &&
      value.definitionVersion === source.definitionVersion &&
      value.generatedAt === snapshot.generatedAt &&
      value.status === 'PASS',
    'Wrong verification'
  );
  demand(
    value.checkedCounties === source.scenarios.length &&
      value.unavailableCounties === 47 - source.scenarios.length,
    'False complete coverage'
  );
  demand(
    Array.isArray(value.countyChecks) &&
      value.countyChecks.length === source.scenarios.length,
    'Missing county checks'
  );
  value.countyChecks.forEach((c, i) => {
    object(c, [
      'areaCode',
      'populationRecords',
      'facilityRecords',
      'hazardRecords',
      'conservationChecks',
    ]);
    const row = snapshot.rows[i];
    demand(
      c.areaCode === row.areaCode &&
        c.populationRecords === row.total.populationRecords &&
        c.facilityRecords ===
          row.total.administrativeFacilities +
            row.total.publicMeetingFacilities &&
        c.hazardRecords === source.scenarios[i].hazardRecords &&
        c.conservationChecks === 5,
      'Wrong verification counts'
    );
  });
}
export async function parseTsunamiBundle(texts: {
  itemText: string;
  manifestText: string;
  verificationText: string;
}) {
  try {
    if (
      Object.values(texts).some(
        (t) => new TextEncoder().encode(t).byteLength > 5_000_000
      )
    )
      return null;
    const snapshot = await verifyTsunamiSnapshot(JSON.parse(texts.itemText));
    const manifest: unknown = JSON.parse(texts.manifestText);
    assertTsunamiManifest(manifest);
    const verification: unknown = JSON.parse(texts.verificationText);
    assertTsunamiVerification(verification, snapshot);
    if (manifest.generatedAt !== snapshot.generatedAt) return null;
    for (const [text, ref] of [
      [texts.itemText, manifest.aggregate],
      [texts.verificationText, manifest.verification],
    ] as const) {
      if (
        new TextEncoder().encode(text).byteLength !== ref.bytes ||
        (await tsunamiSha(text)) !== ref.sha256
      )
        return null;
    }
    return { snapshot, manifest, verification };
  } catch {
    return null;
  }
}
