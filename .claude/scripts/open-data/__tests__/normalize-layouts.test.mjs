import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { assertNormalizedTable, normalizeTable, xlsxRecords } from '../lib/normalize.mjs';
import { validateRecipes } from '../lib/contracts.mjs';
import { provenance } from './fixtures.mjs';

const definition = {
  table: 'daily-counts', filePattern: '\\.csv$', time: '2025', timeColumn: 'date',
  unpivot: { columns: { north: '01000', south: '47000' }, areaColumn: 'area', valueColumn: 'value' },
  areas: [{ level: 'prefecture', column: 'area' }],
  aggregation: 'sum', valueColumn: 'value', unit: '人',
};
const build = (csv, table = definition) => normalizeTable({ datasetId: 'test', version: 'v1', provenance, table,
  members: [{ name: 'source.csv', bytes: Buffer.from(csv) }],
});

test('wide regional observations retain source dates and exclude undeclared total columns', () => {
  const table = build('date,ALL,north,south\n2025-01-01,12,2,10\n2025-01-02,7,3,4\n');
  assert.equal(table.rows.length, 4);
  assert.deepEqual(table.rows.filter((r) => r.areaCode === '01000').map((r) => [r.time, r.value]), [['2025-01-01', 2], ['2025-01-02', 3]]);
  assert.equal(table.rows.reduce((n, r) => n + r.value, 0), 19);
  assertNormalizedTable(table, ['prefecture']);
});

test('unpivot skips only suppressed observations, never substitutes zero or discards another region', () => {
  const csv = 'date,north,south\n2025-01-01,-,10\n2025-01-02,3,\n';
  assert.throws(() => build(csv), /numeric/);
  const table = build(csv, { ...definition, nonNumeric: 'skip' });
  assert.deepEqual(table.rows.map((r) => [r.areaCode, r.time, r.value]), [['01000', '2025-01-02', 3], ['47000', '2025-01-01', 10]]);
});

test('unpivot fails closed on missing columns, output collisions and missing observation dates', () => {
  assert.throws(() => build('date,north\n2025,1'), /Missing CSV column/);
  assert.throws(() => build('date,north,south,area\n2025,1,2,3'), /unpivot/);
  assert.throws(() => build('date,north,south\n,1,2'), /observation time/);
  assert.throws(() => build('date,north,south\n2025,1,2', { ...definition, timeColumn: 'missing' }), /Missing CSV column/);
});

test('monthly XLSX sheets join on identical headers and preserve UTC observation dates', () => {
  const workbook = new ExcelJS.Workbook();
  for (const [month, value] of [['01', 2], ['02', 3]]) {
    const sheet = workbook.addWorksheet(month);
    sheet.addRow(['date', 'pref', 'city', 'value']);
    sheet.addRow([new Date(`2025-${month}-01T00:00:00Z`), '01', '101', value]);
  }
  const xlsx = { sheet: ['01', '02'], headerRow: 1, dataStartRow: 2 };
  const table = normalizeTable({ datasetId: 'test', version: 'v1', provenance,
    members: [{ name: 'source.xlsx', workbook }],
    table: { ...definition, unpivot: undefined, filePattern: '\\.xlsx$', xlsx,
      areas: [{ level: 'prefecture', column: 'pref' }, { level: 'municipality', compose: [{ column: 'pref', width: 2 }, { column: 'city', width: 3 }] }],
    },
  });
  assert.equal(table.rows.length, 4);
  assert.deepEqual([...new Set(table.rows.map((r) => r.time))], ['2025-01-01', '2025-02-01']);
  assertNormalizedTable(table, ['prefecture', 'municipality']);
  assert.throws(() => xlsxRecords(workbook, { ...xlsx, sheet: ['01', 'missing'] }), /Missing XLSX sheet/);
  assert.throws(() => xlsxRecords(workbook, { ...xlsx, sheet: ['01', '01'] }), /sheet list/);
  assert.throws(() => xlsxRecords(workbook, { ...xlsx, sheet: ['01', 1] }), /Duplicate XLSX sheet/);
  workbook.getWorksheet('02').getCell('D1').value = 'different';
  assert.throws(() => xlsxRecords(workbook, xlsx), /headers differ/);
});

test('new layout declarations are constrained by recipe Schema', () => {
  const validate = (table) => validateRecipes({ recipes: [{ datasetId: 'test', version: 'v1', fetch: { type: 'http-file', urls: ['https://example.test/a.csv'] }, normalize: { tables: [table] } }] });
  assert.doesNotThrow(() => validate(definition));
  assert.doesNotThrow(() => validate({ ...definition, xlsx: { sheet: ['a', 2], headerRow: 1, dataStartRow: 2 } }));
  for (const change of [{ timeColumn: '' }, { unpivot: { ...definition.unpivot, columns: {} } }, { unpivot: { ...definition.unpivot, unknown: true } }, ...[[], ['a', 'a'], [0], [['a']]].map((sheet) => ({ xlsx: { sheet, headerRow: 1, dataStartRow: 2 } }))]) {
    assert.throws(() => validate({ ...definition, ...change }), /Schema/);
  }
});
