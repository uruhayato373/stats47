import test from 'node:test';
import assert from 'node:assert/strict';
import { TSUNAMI_EXPOSURE_SOURCE as source } from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-source.ts';
import {
  assertTsunamiCountyRow,
  tsunamiBands,
  assertTsunamiVerification,
} from '../../../../packages/data-configs/src/theme-catalog/tsunami-exposure-schema.ts';
import {
  accumulateNative,
  validateNativePoint,
  assertDisjointBounds,
} from '../lib/tsunami-native-reader.mjs';
import { quarterMeshCenter } from '../lib/tsunami-spatial.mjs';
import { verifyTsunamiIntermediate } from '../ingest-tsunami-exposure.mjs';
const copy = (v) => JSON.parse(JSON.stringify(v));
const scenario = source.scenarios.find((s) => s.areaCode === '13000');
function point(municipality = '13361', band = -1) {
  return {
    id: `13:${municipality}:5339452511`,
    kind: 'population',
    meshCode: '5339452511',
    municipality,
    coordinates: quarterMeshCenter('5339452511'),
    p2020: 12345,
    p2050: 6789,
    band,
  };
}
function intermediate() {
  const points = [
    point(),
    point('13101', -2),
    {
      id: 'P05-22:13:0',
      kind: 'facility',
      municipality: '13361',
      group: 'administrative',
      coordinates: [139.39, 34.75],
      band: 0,
    },
  ];
  const result = accumulateNative(points, scenario);
  return {
    schemaVersion: 1,
    row: {
      areaCode: '13000',
      areaName: '東京都',
      scenarioKey: scenario.key,
      ...result,
    },
    points,
  };
}
test('Known mainland remainder is conserved and never becomes zero exposure/outside', () => {
  const p = intermediate();
  verifyTsunamiIntermediate(p);
  assert.equal(
    p.row.bands.find((b) => b.key === 'outside-model-coverage')
      .population2020Units,
    12345
  );
  assert.equal(
    p.row.bands.find((b) => b.key === 'not-in-positive-source')
      .population2020Units,
    12345
  );
  assert.equal(p.row.total.population2020Units, 24690);
});
for (const [name, edit] of [
  ['mainland mislabelled nonpositive', (p) => (p.band = -1)],
  ['mainland counted as exposed', (p) => (p.band = 0)],
  ['island incorrectly unmodelled', (p) => (p.municipality = '13361')],
  ['negative population', (p) => (p.p2020 = -1)],
  ['raw depth leaked', (p) => (p.depth = 2.1)],
  ['wrong municipality', (p) => (p.municipality = '22001')],
  ['point centre moved', (p) => (p.coordinates[0] += 0.01)],
  ['missing band', (p) => delete p.band],
  ['invented common-depth band', (p) => (p.band = 999)],
  ['fractional population units', (p) => (p.p2050 = 0.3)],
  ['wrong identity', (p) => (p.id = '13:13101:5339452512')],
])
  test(`Point contract rejects ${name}`, () => {
    const p = point('13101', -2);
    edit(p);
    assert.throws(() => validateNativePoint(p, scenario, new Set()));
  });
for (const [name, edit] of [
  ['drop unmodelled mainland', (p) => p.points.splice(1, 1)],
  ['duplicate source identity', (p) => p.points.push(copy(p.points[0]))],
  ['raw geometry', (p) => (p.geometry = {})],
  ['remove unclassified island row', (p) => p.row.bands.splice(-2, 1)],
  [
    'replace native bins with another county',
    (p) => (p.row.bands = p.row.bands.slice(0, -1)),
  ],
  [
    'county-total precision loss',
    (p) =>
      (p.row.total.population2020Units = Math.floor(
        p.row.total.population2020Units / 10000
      )),
  ],
])
  test(`Intermediate contract rejects ${name}`, () => {
    const p = intermediate();
    edit(p);
    assert.throws(() => verifyTsunamiIntermediate(p));
  });
test('Municipality pieces on same mesh are retained once each', () => {
  const ids = new Set();
  validateNativePoint(point(), scenario, ids);
  validateNativePoint(point('13362'), scenario, ids);
  assert.equal(ids.size, 2);
  assert.throws(() => validateNativePoint(point(), scenario, ids));
});
test('Native 1–3m bins are not split into narrower invented bins', () => {
  const s = source.scenarios.find((s) => s.areaCode === '01000');
  assert.ok(
    tsunamiBands(s.areaCode).some((b) => /1m以上.*3m未満/.test(b.label))
  );
  assert.ok(!tsunamiBands(s.areaCode).some((b) => /2m未満/.test(b.label)));
});
test('Unknown county cannot receive native bins', () =>
  assert.throws(() => tsunamiBands('00000')));
test('Hyogo separated coastal inputs may combine only disjoint extents', () => {
  assertDisjointBounds([
    [134.3, 34.1, 135.5, 34.9],
    [134.3, 35.5, 134.9, 35.7],
  ]);
  assert.throws(() =>
    assertDisjointBounds([
      [134, 34, 136, 36],
      [135, 35, 136, 37],
    ])
  );
});
for (const s of source.scenarios.filter(
  (s) => !['22000', '36000'].includes(s.areaCode)
))
  test(`County-native schema accepts ${s.areaCode} without imposing shared bins`, () => {
    const point = { kind: 'population', band: -1, p2020: 10001, p2050: 5001 };
    const row = {
      areaCode: s.areaCode,
      areaName: source.coverage.find((c) => c.areaCode === s.areaCode).areaName,
      scenarioKey: s.key,
      ...accumulateNative([point], s),
    };
    assertTsunamiCountyRow(row);
    const changed = copy(row);
    changed.bands[0].key = 'common-band';
    assert.throws(() => assertTsunamiCountyRow(changed));
  });
test('Verification cannot silently promote all 47 counties', () =>
  assert.throws(() =>
    assertTsunamiVerification(
      {
        schemaVersion: 1,
        definitionVersion: source.definitionVersion,
        generatedAt: '2026-09-11T00:00:00Z',
        status: 'PASS',
        checkedCounties: 47,
        unavailableCounties: 0,
        countyChecks: [],
      },
      { generatedAt: '2026-09-11T00:00:00Z', rows: [] }
    )
  ));
