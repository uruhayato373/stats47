import assert from 'node:assert/strict';
import { test } from 'node:test';
import { latestValues } from '../build-color-policies';
import { colorPolicyErrors, schemaDriftErrors, unaccountedMetrics } from '../check-color-policies';

const row = (over = {}) => ({ metricKey: 'a', grain: 'prefecture', colorSchemeType: 'sequential', classification: { method: 'continuous' }, year: '2024', areaCount: 47, ...over }) as never;
const ledgerOf = (policies: never[], skipped: { metricKey: string; reason: 'no-values' }[] = []) => ({
  schemaVersion: 1 as const, policies, skipped,
  summary: {
    rows: policies.length,
    continuous: (policies as { classification: { method: string } }[]).filter((p) => p.classification.method === 'continuous').length,
    stepped: (policies as { classification: { method: string } }[]).filter((p) => p.classification.method !== 'continuous').length,
    diverging: (policies as { colorSchemeType: string }[]).filter((p) => p.colorSchemeType === 'diverging').length,
    skipped: skipped.length,
  },
});
const known = (key: string) => (key === 'a' ? {} : undefined);

test('最新年を集合の中だけで選び、地域が少ない年は採らない', () => {
  const rows = [
    ...Array.from({ length: 12 }, (_, i) => ({ areaCode: `${i}`, yearCode: '2020', value: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ areaCode: `${i}`, yearCode: '2024', value: i })),
    { areaCode: 'x', yearCode: '2020', value: 100 },
    { areaCode: '0', yearCode: '2020', value: null },
  ];
  const found = latestValues(rows, (code) => code !== 'x')!;
  assert.equal(found.year, '2020');
  assert.equal(found.values.length, 12);
  assert.equal(latestValues(rows.slice(12), () => true), null);
});

test('整合した台帳は通る', () => {
  assert.deepEqual(colorPolicyErrors(ledgerOf([row()]), known), []);
});

test('重複・指標の無い行・発散でない区切りを止める', () => {
  assert.match(colorPolicyErrors(ledgerOf([row(), row()]), known).join(), /重複/);
  assert.match(colorPolicyErrors(ledgerOf([row({ metricKey: 'gone' })]), known).join(), /指標定義に無い/);
  assert.match(colorPolicyErrors(ledgerOf([row({ classification: { method: 'threshold', thresholds: [1] } })]), known).join(), /区切りは発散/);
  assert.match(colorPolicyErrors(ledgerOf([row({ colorScheme: 'interpolateRdBu' })]), known).join(), /配色の差し替え/);
});

test('集計が行と合わなければ止める', () => {
  const ledger = ledgerOf([row()]);
  ledger.summary.continuous = 9;
  assert.match(colorPolicyErrors(ledger, known).join(), /集計/);
});

test('有効な指標は行か理由のどちらかを持つ', () => {
  assert.deepEqual(unaccountedMetrics(ledgerOf([row()]), ['a', 'b']), ['b']);
  assert.deepEqual(unaccountedMetrics(ledgerOf([row()], [{ metricKey: 'b', reason: 'no-values' }]), ['a', 'b']), []);
  assert.match(colorPolicyErrors(ledgerOf([row()], [{ metricKey: 'a', reason: 'no-values' }]), known).join(), /行と理由の両方/);
});

test('Schema の値が型とずれたら止める', () => {
  const schema = (grains: string[]) => ({ properties: {
    policies: { items: { properties: { grain: { enum: grains } } } },
    skipped: { items: { properties: { reason: { enum: ['no-values', 'too-few-areas', 'fetch-failed'] } } } },
  } });
  assert.deepEqual(schemaDriftErrors(schema(['prefecture', 'municipality-merged', 'municipality-split'])), []);
  assert.match(schemaDriftErrors(schema(['prefecture'])).join(), /粒度/);
});
