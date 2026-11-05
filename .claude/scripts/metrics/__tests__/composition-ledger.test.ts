import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compositionSetsFromCatalogs } from '../build-composition-ledger';

const chart = (keys: string[], over = {}) => ({
  componentKey: 'chart', componentType: 'composition-chart', title: '内訳',
  componentProps: { seriesRefs: keys.map((metricKey) => ({ metricKey, label: metricKey })) }, ...over,
});
const units: Record<string, string> = { a: '人', b: '人', c: '円' };
const metricOf = (key: string) => (units[key] ? { unit: units[key] } : undefined);

test('積み上げの定義だけを集める', () => {
  const sets = compositionSetsFromCatalogs([{ key: 't', charts: [chart(['a', 'b']), chart(['a'], { componentType: 'line-chart' })] }], metricOf);
  assert.deepEqual(sets.map((set) => set.id), ['t/chart']);
  assert.deepEqual(sets[0].issues, []);
});

test('足せない組を見つける', () => {
  const issuesOf = (keys: string[]) => compositionSetsFromCatalogs([{ key: 't', charts: [chart(keys)] }], metricOf)[0].issues;
  assert.deepEqual(issuesOf(['a', 'c']), ['mixed-units']);
  assert.deepEqual(issuesOf(['a', 'zzz']), ['unknown-metric']);
  assert.deepEqual(issuesOf(['a', 'b', 'a', 'b', 'a', 'b', 'a']), ['too-many-parts']);
});
