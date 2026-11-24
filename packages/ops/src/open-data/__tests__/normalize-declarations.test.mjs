import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { zipSync } from 'fflate';
import { normalizeTable, assertNormalizedTable, xlsxRecords, csvMembers } from '../lib/normalize.mjs';
import { validateRecipes } from '../lib/contracts.mjs';
import { provenance } from './fixtures.mjs';

const base = { table: 'counts', filePattern: '\\.csv$', areas: [{ level: 'prefecture', column: 'pref' }], time: '2025', aggregation: 'sum', valueColumn: 'value', unit: '人' };
const csv = (text, name = '01_source.csv') => ({ name, bytes: Buffer.from(text) });
const build = (table, members) => normalizeTable({ datasetId: 'test', version: 'v1', provenance, table: { ...base, ...table }, members });
const validate = (table) => validateRecipes({ recipes: [{ datasetId: 'test', version: 'v1', fetch: { type: 'http-file', urls: ['https://example.test/source.csv'] }, normalize: { tables: [{ ...base, ...table }] } }] });

test('filename capture supplies region; failed captures and metadata collisions stop extraction', () => {
  const metadataColumns = { pref: { source: 'filename', pattern: '^([0-9]{2})_' } };
  const result = build({ metadataColumns }, [csv('value\n2'), csv('value\n3', '13_source.csv')]);
  assert.deepEqual(result.rows.map((r) => [r.areaCode, r.value]), [['01000', 2], ['13000', 3]]);
  assert.throws(() => build({ metadataColumns }, [csv('value\n2', 'bad.csv')]), /Capture failed/);
  assert.throws(() => build({ metadataColumns }, [csv('pref,value\n1,2')]), /collision/);
  assert.throws(() => build({ metadataColumns: { pref: { source: 'sheet', pattern: '(.+)' } } }, [csv('value\n2')]), /Missing metadata source/);
});

test('sheet name capture resolves prefecture names through the shared master and preserves dimensions', () => {
  const workbook = new ExcelJS.Workbook();
  for (const name of ['北海道 結果', '東京都 結果']) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(['value']); sheet.addRow([2]);
  }
  const table = { filePattern: '\\.xlsx$', xlsx: { sheet: ['北海道 結果', '東京都 結果'], headerRow: 1, dataStartRow: 2 }, metadataColumns: { pref: { source: 'sheet', pattern: '^(.+) 結果$' } }, areas: [{ level: 'prefecture', column: 'pref', prefectureName: true }], dims: { question: { value: '回答数' } } };
  const result = build(table, [{ name: 'source.xlsx', workbook }]);
  assert.deepEqual(result.rows.map((r) => r.areaCode), ['01000', '13000']);
  assert.deepEqual(result.rows[0].dims, { question: '回答数' });
  assert.throws(() => build({ areas: table.areas }, [csv('pref,value\n架空県,2')]), /Unknown prefecture/);
});

test('merged multi-row headers retain sex and age distinctions without duplicating merged labels', () => {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('data');
  sheet.getCell('A1').value = 'pref'; sheet.mergeCells('A1:A3');
  sheet.getCell('B1').value = '全体'; sheet.mergeCells('B1:C1');
  sheet.getCell('B2').value = '男'; sheet.getCell('C2').value = '女';
  sheet.getCell('B3').value = '人数'; sheet.getCell('C3').value = '人数';
  sheet.addRow(['01', 2, 3]);
  const xlsx = { sheet: 1, headerRow: [1, 2, 3], dataStartRow: 4 };
  assert.deepEqual(xlsxRecords(workbook, xlsx)[0], ['pref', '全体/男/人数', '全体/女/人数']);
  const result = build({ filePattern: '\\.xlsx$', xlsx, unpivot: { columns: { '全体/男/人数': '男', '全体/女/人数': '女' }, areaColumn: 'sex', valueColumn: 'value' }, dims: { sex: 'sex' } }, [{ name: 'a.xlsx', workbook }]);
  assert.deepEqual(result.rows.map((r) => [r.dims.sex, r.value]).sort(), [['女', 3], ['男', 2]]);
});

test('fill-down precedes AND filters so aggregate and national rows do not corrupt province state', () => {
  const result = build({ fillDown: ['pref'], where: [{ column: 'kind', equals: '一般道路計' }, { column: 'pref', matches: '^\\d+$' }, { column: 'cohort', notEquals: '除外' }] }, [csv('pref,kind,cohort,value\n01,合計,対象,99\n,一般道路計,対象,2\n,一般道路計,除外,90\n全国,一般道路計,対象,99\n13,合計,対象,88\n,一般道路計,対象,3')]);
  assert.deepEqual(result.rows.map((r) => [r.areaCode, r.value]), [['01000', 2], ['13000', 3]]);
  assert.throws(() => build({ fillDown: ['missing'] }, [csv('pref,value\n1,2')]), /Missing CSV column/);
});

test('fill-down never carries a region across files or worksheets', () => {
  assert.throws(() => build({ fillDown: ['pref'] }, [csv('pref,value\n01,2'), csv('pref,value\n,3', '02.csv')]), /Empty area/);
  const workbook = new ExcelJS.Workbook();
  for (const [name, pref] of [['a', '01'], ['b', '']]) {
    const sheet = workbook.addWorksheet(name); sheet.addRow(['pref', 'value']); sheet.addRow([pref, 2]);
  }
  assert.throws(() => build({ filePattern: '\\.xlsx$', xlsx: { sheet: ['a', 'b'], headerRow: 1, dataStartRow: 2 }, fillDown: ['pref'] }, [{ name: 'source.xlsx', workbook }]), /Empty area/);
});

test('source-code mapping works inside composition and unknown codes fail before output', () => {
  const mapping = { values: { '10': '01', '11': '01', '30': '13' }, note: 'https://example.test/codebook' };
  const areas = [{ level: 'prefecture', column: 'pref', mapping }, { level: 'municipality', compose: [{ column: 'pref', mapping, width: 2 }, { column: 'city', width: 3 }] }];
  const result = build({ areas }, [csv('pref,city,value\n10,101,2\n11,102,3\n30,101,1')]);
  assert.equal(result.rows.find((r) => r.areaCode === '01000').value, 5);
  assertNormalizedTable(result, ['prefecture', 'municipality']);
  assert.throws(() => build({ areas }, [csv('pref,city,value\n99,101,2')]), /Unmapped area/);
  assert.throws(() => validate({ areas: [{ ...areas[0], mapping: { values: mapping.values } }] }), /Schema/);
  const named = build({ areas: [{ level: 'prefecture', column: 'pref', capture: '^(.+?)(?:全域)?$', prefectureName: true }] }, [csv('pref,value\n北海道全域,2')]);
  assert.equal(named.rows[0].areaCode, '01000');
});

test('explicit XLSX columns and physical row strides select rates without summing counts or national rates', () => {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('data');
  sheet.addRow(['', 'question', '', '']);
  sheet.addRow(['', 'q1', 200, 999]); sheet.addRow(['', '', 20, 99]); sheet.addRow(['', '', 888, 999]); sheet.addRow(['', '', 88, 99]);
  sheet.addRow(['', 'q2', 300, 999]); sheet.addRow(['', '', 30, 99]);
  sheet.mergeCells('B2:B5'); sheet.mergeCells('B6:B7');
  const result = build({ filePattern: '\\.xlsx$', xlsx: { sheet: 1, headerRow: 1, columns: { question: 2, value: 3 }, dataStartRow: 3, dataEndRow: 7, rowStep: 4 }, metadataColumns: { pref: { source: 'filename', pattern: '^([0-9]{2})_' } }, dims: { question: 'question' } }, [{ name: '01_source.xlsx', workbook }]);
  assert.deepEqual(result.rows.map((r) => [r.dims.question, r.value]), [['q1', 20], ['q2', 30]]);
});

test('Schema and semantic gates reject malformed declarations for every extension', () => {
  for (const table of [
    { xlsx: { sheet: 1, headerRow: [1, 3], dataStartRow: 3 } },
    { xlsx: { sheet: 1, headerRow: [1, 1], dataStartRow: 3 } },
    { xlsx: { sheet: 1, headerRow: 1, dataStartRow: 2, rowStep: 0 } },
    { xlsx: { sheet: 1, headerRow: 1, dataStartRow: 2, columns: { a: 1, b: 1 } } },
    { where: [{ column: 'pref', equals: '1', matches: '1' }] },
    { where: [{ column: 'pref', matches: '[' }] },
    { metadataColumns: { pref: { source: 'filename', pattern: '[', group: 1 } } },
    { metadataColumns: { pref: { source: 'url', pattern: '(.*)' } } },
    { areas: [{ level: 'prefecture', column: 'pref', capture: '[' }] },
    { areas: [{ level: 'prefecture', column: 'pref', mapping: { values: {}, note: 'x' } }] },
    { fillDown: ['pref', 'pref'] },
    { dims: { question: { value: 'x', unknown: true } } },
  ]) assert.throws(() => validate(table));
});

test('file selection avoids decoding unrelated workbooks but retains ZIP expansion limits', async () => {
  const unrelated = Buffer.from('not a workbook: must never be decoded');
  assert.deepEqual(await csvMembers(unrelated, 'unused.xlsx', undefined, ['^selected\\.csv$']), []);
  const bytes = Buffer.from(zipSync({ 'selected.csv': Buffer.from('pref,value\n01,2'), 'unused.xlsx': unrelated }));
  const members = await csvMembers(bytes, 'archive.zip', undefined, ['^selected\\.csv$']);
  assert.deepEqual(members.map((m) => m.name), ['selected.csv']);
  assert.equal(build({}, members).rows[0].value, 2);
  const oversized = Buffer.from(zipSync({ 'selected.csv': Buffer.from('pref,value\n01,2'), 'unused.xlsx': Buffer.alloc(10000) }));
  assert.equal((await csvMembers(oversized, 'archive.zip', 1000, ['^selected\\.csv$'])).length, 1);
  assert.deepEqual(await csvMembers(Buffer.alloc(1001), 'unused.xlsx', 1000, ['^selected\\.csv$']), []);
});
