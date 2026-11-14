import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { assertNormalizedTable, csvMembers, decodeCsv, normalizeTable } from '../lib/normalize.mjs';
import { ROOT, REPORT_DIR, loadCatalog, sha256, validateRecipes } from '../lib/contracts.mjs';
import { archiveRecipe } from '../lib/archive.mjs';
import { normalizeRecipe, writeNormalizedTables } from '../normalize-source.mjs';

const recipe = loadCatalog().recipes[0];
const dataset = loadCatalog().datasets[0];
// Synthetic records: they demonstrate the declarative contract, not real hospital totals.
const csv = Buffer.from('\uFEFF都道府県コード,市区町村コード,施設名\r\n01,101,"病院,一"\r\n01,101,病院二\r\n13,101,病院三\r\n');
const name = '01-1_hospital_facility_info_20260601.csv';
const provenance = { manifestKey: 'open-data/raw/test/v1/manifest.json', manifestSha256: sha256('manifest'), recipeSha256: sha256('recipe') };
const buildTable = () => normalizeTable({ datasetId: dataset.id, version: '2026-06-01', table: recipe.normalize.tables[0], members: [{ name, bytes: csv }], provenance });
test('CSV decoding detects UTF-8 and Shift_JIS without replacement characters', () => {
  assert.equal(decodeCsv(Buffer.from('都道府県')), '都道府県');
  assert.equal(decodeCsv(Buffer.from([0x93, 0x73, 0x93, 0xb9, 0x95, 0x7b, 0x8c, 0xa7])), '都道府県');
  assert.throws(() => decodeCsv(Buffer.from([0x81])));
});
test('ZIP expansion rejects traversal and byte budget overflow', async () => {
  const zip = Buffer.from(zipSync({ [name]: csv }));
  const members = await csvMembers(zip, 'source.zip');
  assert.equal(members[0].name, name); assert.deepEqual(members[0].bytes, csv);
  await assert.rejects(csvMembers(Buffer.from(zipSync({ '../escape.csv': csv })), 'bad.zip'), /Unsafe/);
  const huge = Buffer.from(zipSync({ 'a.csv': Buffer.alloc(10000) }));
  await assert.rejects(csvMembers(huge, 'huge.zip', 1000), /limit/);
});
test('one declared table produces prefecture and municipality counts with conserved totals', () => {
  const table = buildTable();
  assert.equal(table.rows.length, 4);
  for (const level of ['prefecture', 'municipality']) assert.equal(table.rows.filter((r) => r.areaLevel === level).reduce((n, r) => n + r.value, 0), 3);
  assert.equal(table.rows.find((r) => r.areaCode === '01101').value, 2);
  assert.equal(table.rows.find((r) => r.areaCode === '13101').value, 1);
  assert.deepEqual(table.rows.filter((r) => r.areaLevel === 'prefecture').map((r) => r.areaCode), ['01000', '13000']);
  assert.equal(table.rows.some((r) => r.areaCode === '00101'), false);
  assert.doesNotThrow(() => assertNormalizedTable(table, ['prefecture', 'municipality']));
  assert.throws(() => normalizeTable({ datasetId: dataset.id, version: 'v1', table: recipe.normalize.tables[0], members: [{ name, bytes: Buffer.from('wrong,header\na,b') }], provenance: {} }), /Missing CSV column/);
});
test('compose requires ordered, bounded components and rejects ambiguous declarations', () => {
  for (const area of [
    { level: 'municipality', compose: [] },
    { level: 'municipality', column: '市区町村コード', compose: [{ column: '都道府県コード', width: 2 }, { column: '市区町村コード', width: 3 }] },
    { level: 'municipality', compose: [{ column: '都道府県コード', width: 2 }, { column: '市区町村コード' }] },
  ]) {
    const changed = structuredClone(recipe);
    changed.normalize.tables[0].areas[1] = area;
    assert.throws(() => validateRecipes({ recipes: [changed] }), /Schema/);
  }
  assert.throws(() => normalizeTable({ datasetId: dataset.id, version: 'v1', table: recipe.normalize.tables[0], members: [{ name, bytes: Buffer.from('都道府県コード,市区町村コード\n01,01101') }], provenance }), /component/);
});
test('standard area codes include national 00000 and strip municipal check digits', () => {
  const table = normalizeTable({ datasetId: dataset.id, version: 'v1', table: {
    ...recipe.normalize.tables[0], areas: [{ level: 'national', column: 'national' }, { level: 'prefecture', column: 'pref' }, { level: 'municipality', column: 'city' }],
  }, members: [{ name, bytes: Buffer.from('national,pref,city\n0,1,011011\n00000,13,13101') }], provenance });
  assert.deepEqual(table.rows.filter((r) => r.areaLevel === 'national').map((r) => [r.areaCode, r.value]), [['00000', 2]]);
  assert.equal(table.rows.find((r) => r.areaCode === '01101').value, 1);
  assert.doesNotThrow(() => assertNormalizedTable(table, ['national', 'prefecture', 'municipality']));
});
test('output Schema rejects nonstandard prefecture and municipality codes', () => {
  for (const [level, code] of [['prefecture', '01'], ['prefecture', '48000'], ['municipality', '00101'], ['municipality', '011011']]) {
    const table = buildTable();
    table.rows.find((r) => r.areaLevel === level).areaCode = code;
    assert.throws(() => assertNormalizedTable(table, ['prefecture', 'municipality']), /Schema/);
  }
});
test('conservation fails before any output, including overwrites and earlier valid tables', (t) => {
  fs.mkdirSync(path.join(ROOT, REPORT_DIR), { recursive: true });
  const root = fs.mkdtempSync(path.join(ROOT, REPORT_DIR, 'test-conservation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const good = buildTable(); const bad = buildTable();
  bad.rows.find((r) => r.areaLevel === 'municipality').value += 1;
  const key = `open-data/normalized/${dataset.id}/v1/hospital-count.json`;
  const pending = [{ key, table: good, levels: ['prefecture', 'municipality'] }, { key: key.replace('v1/', 'v2/'), table: bad, levels: ['prefecture', 'municipality'] }];
  assert.throws(() => writeNormalizedTables(pending, root), /Conservation/);
  assert.equal(fs.existsSync(path.join(root, '.local/r2')), false);
  const existing = path.join(root, '.local/r2', key);
  fs.mkdirSync(path.dirname(existing), { recursive: true }); fs.writeFileSync(existing, 'previous output');
  assert.throws(() => writeNormalizedTables(pending, root), /Conservation/);
  assert.equal(fs.readFileSync(existing, 'utf8'), 'previous output');
});
test('conservation compares each time/dimension/unit slice, not just the grand total', () => {
  for (const field of ['time', 'dims', 'unit']) {
    const table = buildTable();
    const second = structuredClone(table.rows);
    for (const row of table.rows) row[field] = field === 'dims' ? { kind: 'a' } : 'a';
    for (const row of second) row[field] = field === 'dims' ? { kind: 'b' } : 'b';
    table.rows.find((r) => r.areaLevel === 'municipality').value++;
    second.find((r) => r.areaLevel === 'municipality').value--;
    table.rows.push(...second);
    assert.throws(() => assertNormalizedTable(table, ['prefecture', 'municipality']), /Conservation/);
  }
  const missing = buildTable(); missing.rows = missing.rows.filter((r) => r.areaLevel === 'prefecture');
  assert.throws(() => assertNormalizedTable(missing, ['prefecture', 'municipality']), /missing area level/);
});
test('fetch archive → ZIP → normalized JSON preserves provenance and rejects tampering', async (t) => {
  fs.mkdirSync(path.join(ROOT, REPORT_DIR), { recursive: true });
  const root = fs.mkdtempSync(path.join(ROOT, REPORT_DIR, 'test-normalize-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bytes = Buffer.from(zipSync({ [name]: csv }));
  const client = {
    probe: async () => ({ reachable: true, bytes: bytes.length }),
    download: async (url, file) => { fs.writeFileSync(file, bytes); return { bytes: bytes.length, sha256: sha256(bytes), contentType: 'application/zip' }; },
  };
  await archiveRecipe({ recipe, dataset, root, client, apply: true });
  const result = await normalizeRecipe(recipe, root);
  const table = JSON.parse(fs.readFileSync(path.join(root, '.local/r2', result.outputs[0].key)));
  assert.equal(table.rows.length, 4); assert.match(table.provenance.manifestSha256, /^[a-f0-9]{64}$/);
  fs.writeFileSync(path.join(root, '.local/r2', table.provenance.manifestKey), '{}');
  await assert.rejects(normalizeRecipe(recipe, root), /SHA/);
});
