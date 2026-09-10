import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEPTH_BANDS,
  depthBand,
  fixedPopulation,
  quarterMeshCenter,
  pointInPolygonInclusive,
  gridCellKey,
  uniqueIdentity,
  accumulate,
} from '../lib/tsunami-spatial.mjs';
import { verifyTsunamiIntermediate } from '../ingest-tsunami-exposure.mjs';
import { TSUNAMI_EXPOSURE_SOURCE as source } from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-source.ts';
import {
  assertTsunamiSnapshot,
  verifyTsunamiSnapshot,
  selectTsunamiCounty,
  tsunamiCoverage,
  assertTsunamiManifest,
  assertTsunamiVerification,
} from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-schema.ts';
const copy = (x) => JSON.parse(JSON.stringify(x));
function counts() {
  return {
    populationRecords: 0,
    population2020Units: 0,
    population2050Units: 0,
    administrativeFacilities: 0,
    publicMeetingFacilities: 0,
  };
}
function fixture() {
  return {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt: '2026-09-11T00:00:00.000Z',
    rows: source.scenarios.map((s) => {
      const bands = s.bands.map((b) => ({ key: b.key, ...counts() }));
      bands[bands.length - 1].populationRecords = 1;
      bands[bands.length - 1].population2020Units = 10000;
      bands[bands.length - 1].population2050Units = 8000;
      return {
        areaCode: s.areaCode,
        areaName: source.coverage.find((a) => a.areaCode === s.areaCode)
          .areaName,
        scenarioKey: s.key,
        bands,
        total: {
          ...counts(),
          populationRecords: 1,
          population2020Units: 10000,
          population2050Units: 8000,
        },
      };
    }),
  };
}
for (const [d, b] of [
  [0.01, 0],
  [0.29999, 0],
  [0.3, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [5, 5],
  [10, 6],
  [20, 7],
])
  test(`Depth lower bound ${d}`, () => assert.equal(depthBand(d), b));
for (const d of [null, '1', 0, -1, NaN, Infinity])
  test(`Reject invalid depth ${String(d)}`, () =>
    assert.throws(() => depthBand(d)));
test('Quarter-grid split orientation and centre', () => {
  const sw = quarterMeshCenter('5339452511'),
    se = quarterMeshCenter('5339452512'),
    nw = quarterMeshCenter('5339452513');
  assert.ok(Math.abs(se[0] - sw[0] - 1 / 320) < 1e-12);
  assert.ok(Math.abs(nw[1] - sw[1] - 1 / 480) < 1e-12);
  assert.equal(se[1], sw[1]);
  assert.equal(nw[0], sw[0]);
});
for (const code of ['5339452510', '5339452591', '53xx452511', '5339852511'])
  test(`Reject malformed mesh ${code}`, () =>
    assert.throws(() => quarterMeshCenter(code)));
test('Population fractional precision retained', () =>
  assert.equal(fixedPopulation(1.2345), 12345));
for (const value of [-1, NaN, Infinity, 0.00001])
  test(`Reject nonrepresentable population ${value}`, () =>
    assert.throws(() => fixedPopulation(value)));
const rings = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
  [
    [3, 3],
    [7, 3],
    [7, 7],
    [3, 7],
    [3, 3],
  ],
];
for (const [p, result, label] of [
  [[0, 5], true, 'outer boundary'],
  [[3, 5], true, 'hole boundary'],
  [[5, 5], false, 'hole interior'],
  [[1, 1], true, 'inside'],
  [[11, 5], false, 'outside'],
])
  test(`Polygon ${label}`, () =>
    assert.equal(pointInPolygonInclusive(p, rings), result));
test('10m grid uses deterministic half-open edges', () => {
  assert.equal(gridCellKey(10, 20), '1,2');
  assert.equal(gridCellKey(9.999, 20), '0,2');
  assert.equal(gridCellKey(-0.01, 20), '-1,2');
});
test('Municipality parts sharing mesh remain distinct', () => {
  const ids = new Set();
  uniqueIdentity(ids, '22:22100:5339452511');
  uniqueIdentity(ids, '22:22200:5339452511');
  assert.equal(ids.size, 2);
  assert.throws(() => uniqueIdentity(ids, '22:22100:5339452511'));
});
test('Exactly 47 coverage statuses, no national sum', () => {
  const s = fixture();
  assertTsunamiSnapshot(s);
  assert.equal(source.coverage.length, 47);
  assert.equal(
    source.coverage.filter((a) => a.status === 'verified-subset').length,
    29
  );
  assert.equal(selectTsunamiCounty(s, null), null);
  assert.equal(selectTsunamiCounty(s, '37000'), null);
  assert.equal(tsunamiCoverage('37000').status, 'not-provided-by-ksj');
  assert.equal(
    tsunamiCoverage('29000').status,
    'not-in-40-prefecture-reference'
  );
  assert.equal(tsunamiCoverage('26000').status, 'prior-contact-required');
  assert.equal(tsunamiCoverage('39000').status, 'license-conflict');
  assert.equal(tsunamiCoverage('21000').status, 'verified-subset');
});
for (const [label, change] of [
  ['wrong edition', (s) => (s.definitionVersion = '2024')],
  ['county duplication', (s) => (s.rows[1] = copy(s.rows[0]))],
  ['drop outside class', (s) => s.rows[0].bands.pop()],
  [
    'rename outside to safe',
    (s) => (s.rows[0].bands[s.rows[0].bands.length - 1].key = 'safe'),
  ],
  [
    'force uncomputed zero',
    (s) => s.rows.push({ ...copy(s.rows[0]), areaCode: '37000' }),
  ],
  ['invalid total', (s) => s.rows[0].total.population2050Units++],
  ['negative count', (s) => (s.rows[0].bands[0].population2020Units = -1)],
  ['geometry leak', (s) => (s.geometry = {})],
  ['national proxy total', (s) => (s.national = s.rows[0])],
  ['swap scenario', (s) => (s.rows[0].scenarioKey = s.rows[1].scenarioKey)],
])
  test(`Snapshot rejects ${label}`, () => {
    const s = fixture();
    change(s);
    assert.throws(() => assertTsunamiSnapshot(s));
  });
test('Coherently altered facts still fail original facts SHA', async () => {
  const s = fixture();
  assertTsunamiSnapshot(s);
  await assert.rejects(() => verifyTsunamiSnapshot(s));
});
function intermediate() {
  const points = [
    {
      id: '22:22100:5339452511',
      kind: 'population',
      meshCode: '5339452511',
      municipality: '22100',
      coordinates: quarterMeshCenter('5339452511'),
      p2020: 12345,
      p2050: 9999,
      band: -1,
    },
    {
      id: 'P05-22:22:0',
      kind: 'facility',
      group: 'administrative',
      coordinates: [138, 35],
      band: 0,
    },
  ];
  return {
    schemaVersion: 1,
    row: {
      areaCode: '22000',
      areaName: '静岡県',
      scenarioKey: source.scenarios.find((s) => s.areaCode === '22000').key,
      ...accumulate(points),
    },
    points,
  };
}
test('Intermediate includes original outside population and facility denominator', () =>
  verifyTsunamiIntermediate(intermediate()));
for (const [label, change] of [
  ['drop unmatched population', (p) => p.points.shift()],
  ['duplicate identity', (p) => p.points.push(copy(p.points[0]))],
  ['raw hazard values', (p) => (p.points[1].depth = 1.1)],
  ['mutate point centre', (p) => (p.points[0].coordinates[0] += 0.01)],
  ['negative population', (p) => (p.points[0].p2020 = -1)],
  ['unknown facility type', (p) => (p.points[1].group = 'evacuation')],
  ['invalid coordinates', (p) => (p.points[1].coordinates[0] = NaN)],
])
  test(`Intermediate rejects ${label}`, () => {
    const p = intermediate();
    change(p);
    assert.throws(() => verifyTsunamiIntermediate(p));
  });
function manifest() {
  const ref = (key) => ({ key, sha256: 'a'.repeat(64), bytes: 1 });
  return {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt: '2026-09-11T00:00:00Z',
    publicationContract: source.publicationContract,
    canonicalPath: source.canonicalPath,
    inputs: copy(source.inputs),
    evidence: copy(source.evidence),
    scenarios: copy(source.scenarios),
    aggregate: ref(`${source.r2Root}/item.json`),
    verification: ref(`${source.r2Root}/verification.json`),
    intermediates: copy(source.expectedIntermediates),
    reproduction: {
      command: 'run',
      populationIdentity: 'pref municipality mesh',
      overlapPolicy: 'same scenario max',
      unavailablePolicy: 'not zero',
    },
  };
}
test('Approved file-specific input set parses', () =>
  assertTsunamiManifest(manifest()));
for (const [label, change] of [
  ['replace with unlicensed county', (m) => (m.inputs[0].pref = '39')],
  ['change old/new source', (m) => (m.inputs[0].version = 'A40-24')],
  [
    'drop redistribution permission',
    (m) => delete m.inputs[0].redistributionAllowed,
  ],
  ['deny redistribution', (m) => (m.inputs[0].redistributionAllowed = false)],
  [
    'replace rights receipt',
    (m) => (m.inputs[0].licenseEvidence[0].sha256 = 'f'.repeat(64)),
  ],
  ['change model year', (m) => (m.scenarios[0].modelYears = [2026])],
  [
    'erase Tokyo coverage',
    (m) =>
      (m.scenarios.find((s) => s.areaCode === '13000').coverageMunicipalities =
        null),
  ],
  ['drop source', (m) => m.inputs.pop()],
  ['global license relaxation', (m) => (m.publicationContract = 'generic-ksj')],
  ['drop intermediate', (m) => m.intermediates.pop()],
  [
    'change intermediate SHA',
    (m) => (m.intermediates[0].sha256 = 'f'.repeat(64)),
  ],
])
  test(`Manifest rejects ${label}`, () => {
    const m = manifest();
    change(m);
    assert.throws(() => assertTsunamiManifest(m));
  });

test('Every hazard has explicit redistribution approval and matching rights receipts', () => {
  for (const input of source.inputs.filter((i) => i.kind === 'hazard')) {
    assert.equal(input.redistributionAllowed, true);
    assert.ok(input.licenseEvidence.length > 0);
    for (const ref of input.licenseEvidence)
      assert.ok(
        source.evidence.some(
          (e) => e.url === ref.url && e.sha256 === ref.sha256
        )
      );
  }
});
