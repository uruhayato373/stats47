import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCE = {
  publicationIndexUrl: 'https://www.mhlw.go.jp/stf/newpage_68794.html',
  publicationDate: '2026-01-30',
  observationDate: '2025-10-31',
  year: '2025',
  yearName: '2025年10月末時点',
  workbook: { filename: '001646132.xlsx', url: 'https://www.mhlw.go.jp/content/11655000/001646132.xlsx', sha256: '5624ebc1ce7d2eabf87e0b6d0abc3145c16aaf442c44343a8e3608af60ad73c1' },
  tablePdf: { filename: '001646131.pdf', url: 'https://www.mhlw.go.jp/content/11655000/001646131.pdf', sha256: '71abcf4ca6473be0d9e02024a4afa831410b05f975f484ecd11d4350c6e294dd' },
  definitionPdf: { filename: '001646130.pdf', url: 'https://www.mhlw.go.jp/content/11655000/001646130.pdf', sha256: 'f721a210a940ec81732183d27c93ec25430697171dfcc1ed96ccfea7f527b5eb' },
};
export const FIELDS = [
  { key: 'foreign-worker-count', unit: '人', column: 'G', national: 2571037 },
  { key: 'foreign-employing-establishment-count', unit: '所', column: 'C', national: 371215 },
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compact = (text) => String(text).normalize('NFKC').replace(/\s+/g, '');
const shortName = (name) => name === '北海道' ? name : name.slice(0, -1);
const integer = (value, label) => { assert.ok(Number.isSafeInteger(value) && value >= 0, `${label}: expected nonnegative integer`); return value; };

/** Source values are employer notifications at October end, not annual hires or resident population. */
export function extractForeignEmployment(workbook, definitionText, tablePdfText) {
  const definition = compact(definitionText);
  for (const text of ['事業主に雇用される外国人労働者', '特別永住者', '「外交」', '「公用」', 'の者を除く', '届出件数', '令和7年10月末時点']) assert.ok(definition.includes(text), `Missing source definition: ${text}`);
  assert.ok(definition.includes('2,571,037人'));
  assert.ok(definition.includes('371,215所'));
  const sheet = workbook.getWorksheet('別表２');
  const reference = workbook.getWorksheet('参考-7');
  const status = workbook.getWorksheet('別表３');
  assert.ok(sheet && reference && status, 'Required sheets changed');
  assert.equal(sheet.getCell('A1').value, '［別表２］都道府県別外国人雇用事業所数及び外国人労働者数');
  assert.equal(compact(sheet.getCell('A3').value), '令和7年10月末時点');
  assert.equal(sheet.getCell('C4').value, '事業所数');
  assert.equal(sheet.getCell('G4').value, '外国人労働者数');
  assert.equal(compact(sheet.getCell('J3').value), '(単位:所、人)');
  assert.equal(compact(reference.getCell('K4').value), '令和7年');
  assert.equal(reference.getCell('K5').value, '事業所数');
  assert.equal(compact(reference.getCell('M5').value), '外国人労働者数');
  assert.equal(compact(status.getCell('A2').value), '令和7年10月末時点');
  assert.equal(compact(status.getCell('C3').value), '全在留資格計');
  const pdfPages = tablePdfText.normalize('NFKC').split('\f');
  const pdfPage = pdfPages.filter((page) => page.includes('[別表2]都道府県別外国人雇用事業所数及び外国人労働者数') && page.includes('全国計'));
  assert.equal(pdfPage.length, 1, 'Table 2 PDF page missing/ambiguous');
  assert.ok(compact(pdfPage[0]).includes('令和7年10月末時点'));
  const pdfRows = new Map();
  for (const line of pdfPage[0].split('\n')) {
    const m = line.trim().match(/^(\d{1,2})\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+\[([\d.]+)%\]\s+([\d.]+)%\s+([\d,]+)\s+([\d,]+)\s+\[([\d.]+)%\]\s+([\d.]+)%$/);
    if (!m) continue;
    const code = Number(m[1]);
    assert.ok(!pdfRows.has(code), `Duplicate PDF prefecture ${code}`);
    pdfRows.set(code, { name: compact(m[2]), establishments: Number(m[3].replaceAll(',', '')), workers: Number(m[7].replaceAll(',', '')) });
  }
  assert.equal(pdfRows.size, 47, 'PDF prefecture coverage');
  const national = Object.fromEntries(FIELDS.map(({ key, column, national }) => {
    assert.equal(sheet.getCell(`${column}6`).value, national, `National ${key}`);
    return [key, national];
  }));
  assert.equal(reference.getCell('K6').value, national['foreign-employing-establishment-count']);
  assert.equal(reference.getCell('M6').value, national['foreign-worker-count']);
  assert.equal(status.getCell('C5').value, national['foreign-worker-count']);
  const pdfNational = pdfPage[0].split('\n').find((line) => line.includes('全国計'))?.trim().split(/\s+/);
  assert.ok(pdfNational);
  assert.equal(Number(pdfNational[1].replaceAll(',', '')), national['foreign-employing-establishment-count']);
  assert.equal(Number(pdfNational[5].replaceAll(',', '')), national['foreign-worker-count']);
  const numberedRows = [];
  sheet.eachRow((row, index) => { if (Number.isInteger(row.getCell('A').value)) numberedRows.push(index); });
  assert.deepEqual(numberedRows, Array.from({ length: 47 }, (_, i) => i + 7), 'Unexpected prefecture rows');
  const rows = prefectures.map((pref, index) => {
    const row = index + 7;
    assert.equal(sheet.getCell(`A${row}`).value, index + 1);
    assert.equal(sheet.getCell(`B${row}`).value, shortName(pref.prefName));
    assert.equal(reference.getCell(`A${row}`).value, index + 1);
    assert.equal(reference.getCell(`B${row}`).value, shortName(pref.prefName));
    assert.equal(String(status.getCell(`A${index + 6}`).value), String(index + 1));
    assert.equal(status.getCell(`B${index + 6}`).value, shortName(pref.prefName));
    const values = Object.fromEntries(FIELDS.map(({ key, column }) => [key, integer(sheet.getCell(`${column}${row}`).value, `${key}/${pref.prefCode}`)]));
    assert.equal(reference.getCell(`K${row}`).value, values['foreign-employing-establishment-count']);
    assert.equal(reference.getCell(`M${row}`).value, values['foreign-worker-count']);
    assert.equal(status.getCell(`C${index + 6}`).value, values['foreign-worker-count']);
    const pdf = pdfRows.get(index + 1);
    assert.equal(pdf.name, shortName(pref.prefName));
    assert.equal(pdf.establishments, values['foreign-employing-establishment-count']);
    assert.equal(pdf.workers, values['foreign-worker-count']);
    return { areaCode: pref.prefCode, areaName: pref.prefName, values, sourceRow: row };
  });
  assert.equal(new Set(rows.map((row) => row.areaCode)).size, 47);
  for (const { key } of FIELDS) assert.equal(rows.reduce((sum, row) => sum + row.values[key], 0), national[key], `47 prefectures sum ${key}`);
  return { national, rows, checks: { prefectures: 47, sourceValues: 94, pdfMatchedValues: 94, reference7MatchedValues: 94, visaTotalMatchedValues: 47, nationalSumMatches: true } };
}

async function readPinnedSource(spec, dir) {
  const path = resolve(dir, spec.filename);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(spec.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source changed; revalidate first`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source SHA mismatch`);
  return { path, bytes };
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-foreign-employment-source' },
    out: { type: 'string', default: '.local/verification/themes/foreign-employment-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Verify pinned MHLW XLSX and PDFs. Requires Poppler pdftotext. --write-local writes canonical local stats only; no remote writes.'); return; }
  const workbookSource = await readPinnedSource(SOURCE.workbook, options['source-dir']);
  const tableSource = await readPinnedSource(SOURCE.tablePdf, options['source-dir']);
  const definitionSource = await readPinnedSource(SOURCE.definitionPdf, options['source-dir']);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(workbookSource.bytes);
  const run = promisify(execFile);
  const table = await run('pdftotext', ['-layout', tableSource.path, '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const definition = await run('pdftotext', ['-layout', definitionSource.path, '-'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  const extracted = extractForeignEmployment(workbook, definition.stdout, table.stdout);
  const generatedAt = new Date().toISOString();
  const outputs = FIELDS.map(({ key, unit, column }) => {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.unit === unit && config.yearFormat === 'calendar', `${key}: invalid metric config`);
    assert.ok(config.source.kind === 'external' && config.source.fetcherKey === 'manual');
    assert.equal(config.source.config.provenance.url, SOURCE.workbook.url);
    assert.deepEqual(config.years, { from: 2025, to: 2025 });
    const rows = extracted.rows.map(({ values, sourceRow, ...row }) => ({ ...row, value: values[key], unit, yearCode: SOURCE.year, yearName: SOURCE.yearName }));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [SOURCE.year, SOURCE.year], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload);
    return { key: `app/stats/${key}/values.json`, metricKey: key, sha256: sha(content), sourceMatchedRows: 47, sourceCells: `別表２!${column}7:${column}53`, content };
  });
  // Build and validate both payloads before any stats write.
  if (options['write-local']) for (const output of outputs) { const destination = resolve(root, '.local/r2', output.key); await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, output.content); }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', source: SOURCE, national: extracted.national, checks: extracted.checks, files: outputs.map(({ content, ...file }) => file), limitation: '雇用届出件数による10月末時点の雇用状況。特別永住者・在留資格「外交」「公用」は対象外。住民人口・年間新規採用数ではなく、事業所数は企業数ではない。産業別内訳はこの2系列に含めない。' };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: outputs.length, values: 94, output }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
