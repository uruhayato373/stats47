import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
  aggregatePipeRows,
  exactHundredths,
  PIPE_FIELDS,
  SOURCE,
} from '../ingest-water-pipe-maintenance.mjs';
const require = createRequire(resolve(process.cwd(), 'package.json'));
const prefs = require('./packages/area/src/data/prefectures.json');
function entity(
  pref,
  index = 1,
  values = ['10', '20', '30', '1', '2', '3', '0.1', '0.2', '0.3']
) {
  return PIPE_FIELDS.map(([key, name], i) => ({
    source_url: SOURCE.originalUrl,
    fiscal_year: '2024',
    local_public_enterprise_code:
      pref.prefCode.slice(0, 2) + String(index).padStart(4, '0'),
    local_public_enterprise_name: '事業' + index,
    facility_code: '001',
    facility_code_name: '001:末端給水事業',
    cond_1_business_type: '1:上水道事業のみ',
    statistical_table_number: '01',
    statistical_table_name: '01 施設及び業務概況に関する調',
    item_key: key,
    item_name: name,
    item_value: values[i],
    item_unit: '千m',
  }));
}
const fixture = () => prefs.flatMap((p) => entity(p));
function run(rows, { entities = 47, selected = 47, subset = 0 } = {}) {
  return aggregatePipeRows(rows, {
    rawRows: rows.length,
    entities,
    selected,
    subset,
  });
}
function mutated(field, value) {
  const rows = fixture();
  rows[0][field] = value;
  return rows;
}
test('47-prefecture sums preserve units and same denominator', () => {
  const r = run(fixture());
  assert.equal(r.rows.length, 47);
  assert.equal(r.rows[0].totalKm, 60);
  assert.equal(r.rows[0].agedKm, 6);
  assert.equal(r.rows[0].renewedKm, 0.6);
  assert.equal(r.rows[0].agingRate, 10);
  assert.equal(r.rows[0].renewalRate, 1);
  assert.equal(r.national.totalKm, 2820);
});
test('rates use summed lengths, not arithmetic mean of business rates', () => {
  const rows = fixture();
  rows.push(
    ...entity(prefs[0], 2, ['100', '200', '300', '0', '0', '0', '0', '0', '0'])
  );
  const r = run(rows, { entities: 48, selected: 48 });
  assert.equal(r.rows[0].agingRate, 0.909091);
  assert.equal(r.rows[0].renewalRate, 0.090909);
  assert.notEqual(r.rows[0].agingRate, 5);
});
test('same-account simple-water subset is validated and excluded exactly once', () => {
  const rows = fixture();
  rows
    .slice(0, 9)
    .forEach((r) => (r.cond_1_business_type = '2:上水道事業と簡易水道事業'));
  const sub = entity(prefs[0]).map((r) => ({
    ...r,
    facility_code: '006',
    facility_code_name:
      '006:末端給水事業のうち同一会計内の法適用簡易水道事業分',
    cond_1_business_type: '4:上水道事業と簡易水道事業のうち簡易水道事業',
  }));
  const r = run(rows.concat(sub), { entities: 48, selected: 47, subset: 1 });
  assert.equal(r.rows[0].totalKm, 60);
  assert.equal(r.excludedSubset.length, 1);
});
test('aged and renewed lengths are not falsely treated as a disjoint partition', () => {
  const rows = fixture();
  for (const i of [3, 6]) rows[i].item_value = '10';
  assert.equal(run(rows).rows[0].totalKm, 60);
});
for (const [field, value] of [
  ['fiscal_year', '2023'],
  ['item_unit', 'm'],
  ['item_name', '管路延長'],
  ['source_url', 'https://invalid.example/'],
  ['statistical_table_number', '02'],
  ['statistical_table_name', '不明'],
  ['facility_code', '006'],
  ['facility_code', '999'],
  ['local_public_enterprise_code', '990001'],
  ['local_public_enterprise_name', '別の事業名'],
  ['cond_1_business_type', '3:簡易水道事業のみ'],
])
  test('rejects changed ' + field + '=' + value, () =>
    assert.throws(() => run(mutated(field, value)))
  );
for (const value of ['', '-', 'NaN', 'Infinity', '-1', '1e2', '0.001'])
  test('does not coerce ' + JSON.stringify(value) + ' to a length', () =>
    assert.throws(() => exactHundredths(value))
  );
test('missing source item rejects', () => {
  const rows = fixture();
  rows.splice(0, 1);
  assert.throws(() => run(rows), /missing pipe field/);
});
test('duplicate source item rejects', () => {
  const rows = fixture();
  rows.push({ ...rows[0] });
  assert.throws(() => run(rows), /duplicate/);
});
test('missing prefecture rejects even if total business count preserved', () => {
  const rows = fixture();
  rows.splice(0, 9);
  rows.push(...entity(prefs[1], 2));
  assert.throws(() => run(rows), /missing prefecture/);
});
test('aged greater than corresponding pipe length rejects', () => {
  const rows = fixture();
  rows[3].item_value = '10.01';
  assert.throws(() => run(rows), /aged > total/);
});
test('renewed greater than corresponding pipe length rejects', () => {
  const rows = fixture();
  rows[6].item_value = '10.01';
  assert.throws(() => run(rows), /renewed > total/);
});
test('zero denominator is not a zero percent', () => {
  const rows = fixture();
  rows.slice(0, 9).forEach((r) => (r.item_value = '0'));
  assert.throws(() => run(rows), /denominator zero/);
});
test('national mismatch fails closed', async () => {
  const { assertPinnedNational } =
    await import('../ingest-water-pipe-maintenance.mjs');
  assert.throws(() => assertPinnedNational(run(fixture())), /national/);
});
test('bad excluded subset is recorded, never used to repair or add to full accounts', () => {
  const rows = fixture();
  rows
    .slice(0, 9)
    .forEach((r) => (r.cond_1_business_type = '2:上水道事業と簡易水道事業'));
  const sub = entity(prefs[0]).map((r) => ({
    ...r,
    facility_code: '006',
    facility_code_name:
      '006:末端給水事業のうち同一会計内の法適用簡易水道事業分',
    cond_1_business_type: '4:上水道事業と簡易水道事業のうち簡易水道事業',
  }));
  sub[3].item_value = '11';
  const result = run(rows.concat(sub), {
    entities: 48,
    selected: 47,
    subset: 1,
  });
  assert.equal(result.rows[0].totalKm, 60);
  assert.equal(result.rows[0].agedKm, 6);
  assert.equal(result.checks.subsetParentWarnings.length, 1);
  assert.equal(result.checks.subsetInternalWarnings.length, 1);
});
test('an orphan subset cannot silently disappear from source coverage', () => {
  const rows = fixture();
  const sub = entity(prefs[0], 2).map((r) => ({
    ...r,
    facility_code: '006',
    facility_code_name:
      '006:末端給水事業のうち同一会計内の法適用簡易水道事業分',
    cond_1_business_type: '4:上水道事業と簡易水道事業のうち簡易水道事業',
  }));
  assert.throws(
    () => run(rows.concat(sub), { entities: 48, selected: 47, subset: 1 }),
    /orphan/
  );
});
