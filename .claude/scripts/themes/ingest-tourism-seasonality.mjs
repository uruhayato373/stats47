import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';

const require = createRequire(import.meta.url);
const Excel = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { TOURISM_SEASONALITY_SOURCE: SOURCE } = require('../../../packages/data-configs/src/theme-catalog/tourism-seasonality-source.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compact = (value) => String(value ?? '').replaceAll(/\s/g, '');
const cell = (sheet, address) => sheet.getCell(address).value;
const sum = (values) => values.reduce((total, value) => total + value, 0);

function valueAt(sheet, address) {
  const value = cell(sheet, address);
  assert.ok(Number.isSafeInteger(value) && value >= 0, `${sheet.name}!${address}: missing/noninteger value`);
  assert.equal(value % SOURCE.rounding.quantum, 0, `${sheet.name}!${address}: rounding changed`);
  return value;
}
function requiredSheet(workbook, name) {
  const sheet = workbook.getWorksheet(name);
  assert.ok(sheet, `Missing sheet ${name}`);
  assert.match(compact(cell(sheet, 'A1')), /別延べ宿泊者数/);
  assert.match(compact(cell(sheet, 'A4')), /施設所在地/);
  assert.match(compact(cell(sheet, 'B4')), /^延べ宿泊者数/);
  assert.equal(compact(cell(sheet, sheet.name.startsWith('第4表') ? 'O2' : SOURCE.table.unitCell)), '(人泊)');
  return sheet;
}
function readPrefectures(sheet) {
  const rows = [];
  const codes = new Set();
  for (const [index, pref] of prefectures.entries()) {
    const row = SOURCE.table.firstPrefectureRow + index;
    assert.equal(compact(cell(sheet, `A${row}`)), pref.prefCode.slice(0, 2) + pref.prefName, `${sheet.name}: geography mismatch row ${row}`);
    assert.ok(!codes.has(pref.prefCode), `Duplicate ${pref.prefCode}`);
    codes.add(pref.prefCode);
    rows.push({ areaCode: pref.prefCode, areaName: pref.prefName, value: valueAt(sheet, `B${row}`) });
  }
  assert.equal(rows.length, 47);
  const labelledRows = [];
  sheet.eachRow((row) => { if (/^\d{2}[^\d]/u.test(compact(row.getCell(1).value))) labelledRows.push(row.number); });
  assert.deepEqual(labelledRows, Array.from({ length: 47 }, (_, i) => i + 8), `${sheet.name}: extra/duplicate prefecture rows`);
  return rows;
}
function reconcile(actual, expected, contributors, label) {
  // Independent rounding to nearest 10: each contributor and total can differ by at most 5.
  const tolerance = (contributors + 1) * SOURCE.rounding.quantum / 2;
  const delta = actual - expected;
  assert.ok(Math.abs(delta) <= tolerance, `${label}: ${delta} outside rounding bound ${tolerance}`);
  return { label, actual, expected, delta, tolerance, status: delta === 0 ? 'exact' : 'within-source-rounding' };
}

export function extractTourismSeasonality(workbook, releaseText, reportText) {
  assert.equal(prefectures.length, 47);
  assert.ok(reportText.includes('一の位を四捨五入して十の位まで'));
  assert.ok(reportText.includes('必ずしも総数と一致しない'));
  const releasePage = releaseText.split('\f')[SOURCE.release.nationalMonthlyPdfPage - 1];
  assert.ok(releasePage?.includes('延べ宿泊者数推移表'));
  const start = releasePage.search(/2024年\s+1月/);
  assert.ok(start >= 0, 'Final release monthly section absent');
  const releaseMonths = [...releasePage.slice(start).matchAll(/^\s*(?:2024年\s+)?(\d{1,2})月\s+([\d,]+)/gm)].map((m) => ({ month: Number(m[1]), value: Number(m[2].replaceAll(',', '')) }));
  assert.deepEqual(releaseMonths.map((item) => item.month), Array.from({ length: 12 }, (_, i) => i + 1));
  const rows = [], national = [], lineage = [], monthlyReconciliation = [];
  let crossTableMatches = 0;
  for (let month = 1; month <= 12; month++) {
    const period = `${SOURCE.year}-${String(month).padStart(2, '0')}`;
    const sheet = requiredSheet(workbook, SOURCE.table.monthlySheetPattern.replace('{month}', String(month)));
    const cross = requiredSheet(workbook, SOURCE.table.crossCheckSheetPattern.replace('{month}', String(month)));
    assert.equal(compact(cell(sheet, 'A7')), `令和6年${month}月`);
    assert.equal(compact(cell(cross, 'A7')), `令和6年${month}月`);
    const prefRows = readPrefectures(sheet);
    assert.deepEqual(readPrefectures(cross), prefRows, `Cross table ${period}`);
    const value = valueAt(sheet, 'B7');
    assert.equal(valueAt(cross, 'B7'), value);
    assert.equal(releaseMonths[month - 1].value, value, `Release national ${period}`);
    crossTableMatches += 48;
    national.push({ period, value });
    lineage.push({ period, areaCode: '00000', areaName: '全国（公式集計）', value, sheet: sheet.name, address: 'B7' });
    rows.push(...prefRows.map((row) => ({ ...row, period })));
    lineage.push(...prefRows.map((row, index) => ({ ...row, period, sheet: sheet.name, address: `B${8 + index}` })));
    monthlyReconciliation.push(reconcile(sum(prefRows.map((row) => row.value)), value, 47, period));
  }
  const annual = requiredSheet(workbook, SOURCE.table.annualSheet);
  assert.equal(compact(cell(annual, 'A7')), '令和6年1～12月計');
  const annualPrefectures = readPrefectures(annual);
  const annualNational = valueAt(annual, 'B7');
  const annualInRelease = releasePage.match(/^\s*2024年\s+([\d,]+)/m);
  assert.ok(annualInRelease);
  assert.equal(Number(annualInRelease[1].replaceAll(',', '')), annualNational);
  const annualReconciliation = annualPrefectures.map((pref) => reconcile(sum(rows.filter((row) => row.areaCode === pref.areaCode).map((row) => row.value)), pref.value, 12, pref.areaCode));
  annualReconciliation.unshift(reconcile(sum(national.map((row) => row.value)), annualNational, 12, 'national'));
  assert.equal(rows.length, 564);
  assert.equal(new Set(rows.map((row) => `${row.areaCode}:${row.period}`)).size, 564);
  assert.equal(national.length, 12);
  return {
    rows, national, lineage,
    verification: {
      status: 'PASS', metric: '延べ宿泊者数（全施設）', unit: '人泊', releaseStatus: 'final',
      prefectures: 47, months: 12, rows: 564, nationalRows: 12, duplicates: 0, missing: 0,
      crossTableMatches, nationalReleaseMatches: 12,
      annualNational, monthlyReconciliation, annualReconciliation,
      maxNationalPrefectureSumDifference: Math.max(...monthlyReconciliation.map((v) => Math.abs(v.delta))),
      maxAnnualMonthlySumDifference: Math.max(...annualReconciliation.map((v) => Math.abs(v.delta))),
      rounding: SOURCE.rounding, nationalPolicy: 'official-row-only; never replace with prefecture sum',
    },
  };
}

async function checkedSource(dir, filename, source) {
  const path = resolve(dir, filename);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(source.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), source.sha256, `Source changed: ${filename}; revalidate before importing`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), source.sha256, `Source hash mismatch: ${filename}`);
  return { path, bytes };
}
async function pdfText(path) {
  return (await promisify(execFile)('pdftotext', ['-layout', path, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })).stdout;
}
async function main() {
  const { values: options } = parseArgs({ options: {
    'source-dir': { type: 'string', default: '/tmp/stats47-tourism-monthly-source' },
    out: { type: 'string', default: '.local/verification/themes/tourism-seasonality' },
    'write-local': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Verify 2024 final official XLSX/PDF sources and emit monthly artifacts in --out. --write-local also stages app/themes/tourism/seasonality.json. Requires pdftotext.'); return; }
  const workbookSource = await checkedSource(options['source-dir'], '2024-final.xlsx', SOURCE.source);
  const releaseSource = await checkedSource(options['source-dir'], '2024-final-release.pdf', SOURCE.release);
  const reportSource = await checkedSource(options['source-dir'], '2024-final-report.pdf', SOURCE.report);
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(workbookSource.bytes);
  const extracted = extractTourismSeasonality(workbook, await pdfText(releaseSource.path), await pdfText(reportSource.path));
  const generatedAt = new Date().toISOString();
  const payload = { schemaVersion: 1, seriesKey: SOURCE.seriesKey, year: SOURCE.year, unit: SOURCE.unit, releaseStatus: SOURCE.releaseStatus, generatedAt, source: SOURCE.source, rows: extracted.rows, national: extracted.national };
  const content = JSON.stringify(payload);
  const out = resolve(options.out);
  await mkdir(out, { recursive: true });
  await writeFile(resolve(out, 'monthly-values.json'), `${content}\n`);
  await writeFile(resolve(out, 'definition.json'), `${JSON.stringify(SOURCE, null, 2)}\n`);
  await writeFile(resolve(out, 'cell-lineage.json'), `${JSON.stringify({ source: SOURCE.source, rows: extracted.lineage }, null, 2)}\n`);
  const verification = { generatedAt, ...extracted.verification, source: SOURCE.source, r2Key: SOURCE.r2Key, payloadSha256: sha(content), localStaged: options['write-local'] };
  if (options['write-local']) {
    const destination = resolve(root, '.local/r2', SOURCE.r2Key);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  await writeFile(resolve(out, 'verification.json'), `${JSON.stringify(verification, null, 2)}\n`);
  console.log(JSON.stringify({ status: verification.status, rows: payload.rows.length, nationalRows: payload.national.length, crossTableMatches: verification.crossTableMatches, nationalReleaseMatches: verification.nationalReleaseMatches, maxNationalPrefectureSumDifference: verification.maxNationalPrefectureSumDifference, localStaged: verification.localStaged, out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
