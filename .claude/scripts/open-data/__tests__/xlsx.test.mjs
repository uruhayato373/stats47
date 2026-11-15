import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { zipSync } from 'fflate';
import { assertNormalizedTable, csvMembers, normalizeTable } from '../lib/normalize.mjs';
import { normalizeRecipe } from '../normalize-source.mjs';
import { restoreRecipe } from '../restore-source.mjs';
import { validateRecipes } from '../lib/contracts.mjs';
import { localKey } from '../lib/archive.mjs';
import { archivedFixture, workbookBytes, xlsxTable, provenance } from './fixtures.mjs';

async function build(bytes, table = xlsxTable) {
  return normalizeTable({ datasetId: 'test', version: '2026', table, members: await csvMembers(bytes, 'source.xlsx'), provenance });
}

test('XLSX sheet selection, header/start rows, formulas, merges, dimensions and sums share conservation checks', async () => {
  const bytes = await workbookBytes();
  const table = await build(bytes);
  assert.equal(table.rows.find((row) => row.areaCode === '01000').value, 5);
  assert.equal(table.rows.find((row) => row.areaCode === '01101').value, 2);
  assert.equal(table.rows.find((row) => row.areaCode === '01102').value, 3);
  assert.equal(table.rows.find((row) => row.areaCode === '13101').value, 0);
  assert.deepEqual(table.rows.find((row) => row.areaCode === '01000').dims, { kind: '病院' });
  assert.equal(table.rows[0].time, '2026');
  assertNormalizedTable(table, ['prefecture', 'municipality']);
  assert.deepEqual(await build(bytes, { ...xlsxTable, xlsx: { ...xlsxTable.xlsx, sheet: 2 } }), table);
  const limited = await build(bytes, { ...xlsxTable, xlsx: { sheet: 2, headerRow: 2, dataStartRow: 4, dataEndRow: 4 } });
  assert.equal(limited.rows.length, 2);
  assert.equal(limited.rows[0].value, 2);
});

for (const cell of ['-', '…', 'x', null, { formula: '1+1' }, { error: '#N/A' }]) test(`XLSX non-numeric ${JSON.stringify(cell)} defaults to error and skip drops the entire record`, async () => {
  const bytes = await workbookBytes((sheet) => { sheet.getCell('D5').value = cell; });
  await assert.rejects(build(bytes), /Invalid numeric cell/);
  await assert.rejects(build(bytes, { ...xlsxTable, nonNumeric: 'error' }), /Invalid numeric cell/);
  const table = await build(bytes, { ...xlsxTable, nonNumeric: 'skip' });
  assert.equal(table.rows.some((row) => row.areaCode === '01102'), false);
  assert.equal(table.rows.find((row) => row.areaCode === '01000').value, 2);
  assertNormalizedTable(table, ['prefecture', 'municipality']);
});

test('XLSX requires explicit, valid worksheet and row settings', async () => {
  const bytes = await workbookBytes();
  for (const xlsx of [undefined, { ...xlsxTable.xlsx, sheet: 'missing' }, { ...xlsxTable.xlsx, sheet: 3 }, { ...xlsxTable.xlsx, dataStartRow: 2 }, { ...xlsxTable.xlsx, stopOnBlankColumn: 'missing' }]) {
    await assert.rejects(build(bytes, { ...xlsxTable, xlsx }), /XLSX/);
  }
  await assert.rejects(build(bytes, { ...xlsxTable, nonNumeric: 'zero' }), /nonNumeric/);
});

test('recipe schema and semantic validation reject invalid XLSX declarations', () => {
  const recipe = { datasetId: 'test', version: 'v1', fetch: { type: 'http-file', urls: ['https://example.test/a.xlsx'] }, normalize: { tables: [xlsxTable] } };
  assert.doesNotThrow(() => validateRecipes({ recipes: [recipe] }));
  for (const change of [
    { nonNumeric: 'zero' }, { xlsx: {} }, { xlsx: { ...xlsxTable.xlsx, sheet: 0 } },
    { xlsx: { ...xlsxTable.xlsx, headerRow: 0 } }, { xlsx: { ...xlsxTable.xlsx, headerRow: 4 } },
    { xlsx: { ...xlsxTable.xlsx, dataStartRow: 1.5 } }, { xlsx: { ...xlsxTable.xlsx, dataEndRow: 3 } },
    { xlsx: { ...xlsxTable.xlsx, unknown: true } },
  ]) assert.throws(() => validateRecipes({ recipes: [{ ...recipe, normalize: { tables: [{ ...xlsxTable, ...change }] } }] }));
});

for (const zipped of [false, true]) test(`verified raw ${zipped ? 'ZIP containing XLSX' : 'XLSX'} normalizes through the full pipeline`, async (t) => {
  const xlsx = await workbookBytes();
  const files = zipped ? { 'source.zip': Buffer.from(zipSync({ 'nested/source.xlsx': xlsx, 'notes.txt': Buffer.from('ignored') })) } : { 'source.xlsx': xlsx };
  const fixture = await archivedFixture(t, { files, definition: xlsxTable });
  await restoreRecipe(fixture);
  const result = await normalizeRecipe(fixture.recipe, fixture.root);
  const table = JSON.parse(fs.readFileSync(localKey(fixture.root, result.outputs[0].key)));
  assert.equal(table.rows.find((row) => row.areaCode === '01000').value, 5);
  assert.equal(table.provenance.manifestSha256, fixture.entry.manifestSha256);
  assertNormalizedTable(table, ['prefecture', 'municipality']);
});

test('XLSX internal ZIP expansion is bounded', async () => {
  const bytes = Buffer.from(zipSync({ 'large.xml': Buffer.alloc(10000) }));
  await assert.rejects(csvMembers(bytes, 'source.xlsx', 1000), /limit/);
});

test('XLSX count aggregation counts records at every level without using value cells', async () => {
  const bytes = await workbookBytes((sheet) => { sheet.getCell('D5').value = '-'; });
  const table = await build(bytes, { ...xlsxTable, aggregation: 'count' });
  assert.equal(table.rows.find((row) => row.areaCode === '01000').value, 2);
  assert.equal(table.rows.find((row) => row.areaCode === '13000').value, 1);
  assertNormalizedTable(table, ['prefecture', 'municipality']);
});

test('CSV shares the non-numeric skip policy with XLSX', async () => {
  const table = normalizeTable({ datasetId: 'test', version: 'v1', provenance,
    table: { ...xlsxTable, xlsx: undefined, filePattern: '\\.csv$', nonNumeric: 'skip' },
    members: await csvMembers(Buffer.from('pref,city,kind,value\n1,101,病院,2\n1,102,病院,-\n'), 'source.csv'),
  });
  assert.equal(table.rows.length, 2);
  assertNormalizedTable(table, ['prefecture', 'municipality']);
});
