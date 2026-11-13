import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { inspectLandingArchive, selectLandingMetric, sha256 } from '../lib/product-landing-evidence.mjs';
import { PREF_AREA_CODES } from '../../lib/prefectures.cjs';

const csv = (rows) => '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');

async function fixture(change = () => {}) {
  const rows = [['都道府県コード', '都道府県', '見本（人・2020）', '注記'], ...PREF_AREA_CODES.map((code, i) => [code, `地域${i + 1}`, String(47 - i), ''])];
  const sources = [{ 調査名: '公的統計', 表名: '見本', 年: '2020', 単位: '人', URL: 'https://example.com/source', 加工式: 'app/ranking/sample/values.json' }];
  change(rows, sources);
  const zip = new JSZip();
  zip.file('data.csv', csv(rows));
  zip.file('SOURCES.csv', csv([Object.keys(sources[0]), ...sources.map((row) => Object.values(row))]));
  const bytes = await zip.generateAsync({ type: 'nodebuffer' });
  return { bytes, archive: { bytes: bytes.length, sha256: sha256(bytes) }, delivery: { indicatorCount: 1 } };
}

test('LP examples use the fixed ZIP year and preserve source metadata and tied ranks', async () => {
  const f = await fixture((rows) => { rows[2][2] = rows[1][2]; });
  const evidence = await inspectLandingArchive(f.bytes, f.archive, f.delivery);
  const selected = selectLandingMetric(evidence, 'sample');
  assert.equal(selected.year, '2020');
  assert.equal(selected.unit, '人');
  assert.deepEqual(selected.rows.slice(0, 3).map((row) => row.rank), [1, 1, 3]);
  assert.equal(selected.rows.length, 47);
});

test('a changed archive, wrong indicator count or duplicate prefecture stops generation', async () => {
  const f = await fixture();
  await assert.rejects(inspectLandingArchive(f.bytes, { ...f.archive, sha256: '0'.repeat(64) }, f.delivery), /SHA/);
  await assert.rejects(inspectLandingArchive(f.bytes, f.archive, { indicatorCount: 2 }), /指標数/);
  const duplicate = await fixture((rows) => { rows[2][0] = rows[1][0]; });
  await assert.rejects(inspectLandingArchive(duplicate.bytes, duplicate.archive, duplicate.delivery), /47都道府県/);
});

test('unlisted indicators and missing values never become current values or zeroes', async () => {
  const f = await fixture((rows) => { rows[1][2] = ''; });
  const evidence = await inspectLandingArchive(f.bytes, f.archive, f.delivery);
  assert.throws(() => selectLandingMetric(evidence, 'not-in-delivery'), /収録されていない/);
  assert.throws(() => selectLandingMetric(evidence, 'sample'), /欠損/);
});

test('a mismatched source title/year/unit cannot be paired with another CSV column', async () => {
  const f = await fixture((rows, sources) => { sources[0]['年'] = '2025'; });
  await assert.rejects(inspectLandingArchive(f.bytes, f.archive, f.delivery), /定義・年・単位/);
});

test('a published ZIP with one enclosing folder retains the same delivery evidence', async () => {
  const f = await fixture();
  const original = await JSZip.loadAsync(f.bytes);
  const wrapped = new JSZip();
  for (const entry of Object.values(original.files)) wrapped.file(`P-14/${entry.name}`, await entry.async('nodebuffer'));
  const bytes = await wrapped.generateAsync({ type: 'nodebuffer' });
  const result = await inspectLandingArchive(bytes, { bytes: bytes.length, sha256: sha256(bytes) }, f.delivery);
  assert.deepEqual(result.files, ['SOURCES.csv', 'data.csv']);
  assert.equal(selectLandingMetric(result, 'sample').rows.length, 47);
});
