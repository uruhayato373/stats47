import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { parseFactoryWorkbook } from './ingest-factory-investment.mjs';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefs = require('../../../packages/area/src/data/prefectures.json');
const {
  FACTORY_INVESTMENT_SOURCE: source,
} = require('../../../packages/data-configs/src/theme-catalog/factory-investment-source.ts');
const {
  factoryInvestmentSnapshotSchema,
} = require('../../../apps/web/src/features/factory-investment/lib/factory-investment-snapshot.ts');
function workbook() {
  const w = new ExcelJS.Workbook(),
    s = w.addWorksheet('14'),
    a = w.addWorksheet('13');
  for (const [cell, value] of Object.entries({
    A1: '第14表　設備投資額 （都道府県別） ［平成17年～令和6年］',
    W2: '(百万円)',
    W3: '6年',
    B4: '全国合計',
    D52: '研究所を含まない。',
    W4: source.national,
  }))
    s.getCell(cell).value = value;
  a.getCell('W4').value = source.national;
  for (const [i, pref] of prefs.entries()) {
    s.getCell(`A${i + 5}`).value = pref.prefCode.slice(0, 2);
    s.getCell(`B${i + 5}`).value =
      i === 0 ? pref.prefName : pref.prefName.slice(0, -1);
    s.getCell(`W${i + 5}`).value = source.suppressedCodes.includes(
      pref.prefCode
    )
      ? 'X'
      : i;
  }
  return w;
}
test('public zero stays zero and suppressed X stays null without back-calculation', () => {
  const p = parseFactoryWorkbook(workbook());
  assert.equal(p.rows[0].value, 0);
  assert.equal(p.rows.filter((r) => r.status === 'suppressed').length, 3);
  assert(
    p.rows
      .filter((r) => r.status === 'suppressed')
      .every((r) => r.value === null)
  );
  assert.equal(p.national, source.national);
});
for (const [name, cell, value] of [
  ['wrong unit', 'W2', '(千円)'],
  ['wrong year', 'W3', '7年'],
  ['wrong area', 'A5', '02'],
  ['wrong area name', 'B5', '青森'],
  ['changed scope', 'D52', '研究所を含む。'],
  ['zero substituted for suppression', 'W43', 0],
  ['unknown marker', 'W5', '-'],
  ['negative amount', 'W5', -1],
  ['blank amount', 'W5', null],
  ['wrong national', 'W4', 1],
])
  test(name, () => {
    const w = workbook();
    w.getWorksheet('14').getCell(cell).value = value;
    assert.throws(() => parseFactoryWorkbook(w));
  });
test('different national by industry fails', () => {
  const w = workbook();
  w.getWorksheet('13').getCell('W4').value = 1;
  assert.throws(() => parseFactoryWorkbook(w));
});
test('duplicate prefecture in delivery fails', () => {
  const p = parseFactoryWorkbook(workbook());
  p.rows[1] = p.rows[0];
  assert.equal(factoryInvestmentSnapshotSchema.safeParse(p).success, false);
});
test('delivery cannot drop suppression note', () => {
  const p = parseFactoryWorkbook(workbook());
  p.notes.pop();
  assert.equal(factoryInvestmentSnapshotSchema.safeParse(p).success, false);
});
test('delivery cannot relabel suppression as zero', () => {
  const p = parseFactoryWorkbook(workbook());
  p.rows.find((r) => r.status === 'suppressed').value = 0;
  assert.equal(factoryInvestmentSnapshotSchema.safeParse(p).success, false);
});
