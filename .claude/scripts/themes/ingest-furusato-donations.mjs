import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCES = [
  { key: 'receipts', file: '001084989.xlsx', sha256: 'e6299d05a172f00472971f1684f250cb38da4fd596408f03f333a0c1bc5452e2' },
  { key: 'history', file: '001084990.xlsx', sha256: '516c6cd0efcb53e82aead1b7a13a404d3ca74a8ef68af17af0406b6cd7f77407' },
  { key: 'deductions', file: '001085012.xlsx', sha256: '157ec580017313a607c34bd46899b77c9136485865548ded2ee7a3b6bed90b5b' },
];
const DEDUCTIONS = [['furusato-tax-deduction-municipal-prefecture', 57], ['furusato-tax-deduction-prefectural-prefecture', 60]];
const FIELDS = [
  ['furusato-donation-amount-prefecture', 5],
  ['furusato-donation-count-prefecture', 4],
  ['furusato-fundraising-cost-prefecture', 18],
  ['furusato-return-gift-procurement-cost-prefecture', 12],
  ['furusato-return-gift-shipping-cost-prefecture', 13],
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const cell = (sheet, row, column) => {
  const value = sheet.getRow(row).getCell(column).value;
  return value && typeof value === 'object' && 'result' in value ? value.result : value;
};
const number = (value) => {
  assert.equal(typeof value, 'number', 'Missing/non-numeric source cell');
  assert.ok(Number.isFinite(value) && value >= 0, 'Invalid source number');
  return value;
};

/** Verify the fiscal period, authority scope and independent receipt totals before writing. */
export function extractFurusato(receipts, history, names) {
  assert.ok(String(cell(receipts, 3, 1)).includes('令和７年度（令和７年４月１日～令和８年３月31日）'));
  assert.equal(cell(history, 2, 37), '令和７年度');
  assert.equal(cell(receipts, 13, 4), '件数');
  assert.equal(cell(receipts, 13, 5), '金額');
  const rows = [];
  let allAmount = 0;
  let allCount = 0;
  let authorities = 0;
  for (let r = 14; r <= receipts.rowCount; r++) {
    const code = String(cell(receipts, r, 1)).padStart(6, '0');
    assert.match(code, /^\d{6}$/);
    const amount = number(cell(receipts, r, 5));
    const count = number(cell(receipts, r, 4));
    allAmount += amount;
    allCount += count;
    authorities++;
    const areaCode = code.slice(0, 5);
    if (!names.has(areaCode)) continue;
    const areaName = cell(receipts, r, 2);
    assert.equal(areaName, names.get(areaCode));
    assert.ok([null, undefined, 0, '0', ''].includes(cell(receipts, r, 3)), 'Municipality mixed with prefecture');
    const matches = [];
    for (let h = 3; h <= history.rowCount; h++) {
      if (cell(history, h, 1) === areaName && cell(history, h, 2) == null) matches.push(h);
    }
    assert.equal(matches.length, 1);
    assert.ok(Math.abs(number(cell(history, matches[0], 37)) * 1000 - amount) < 0.00001);
    assert.equal(number(cell(history, matches[0], 38)), count);
    const costs = Array.from({ length: 6 }, (_, i) => number(cell(receipts, r, 12 + i)));
    assert.ok(Math.abs(costs.reduce((a, b) => a + b, 0) - number(cell(receipts, r, 18))) < 0.00001);
    rows.push({ areaCode, areaName, sourceRow: r, values: Object.fromEntries(FIELDS.map(([key, col]) => [key, number(cell(receipts, r, col))])) });
  }
  assert.equal(rows.length, 47);
  assert.equal(new Set(rows.map((row) => row.areaCode)).size, 47);
  assert.equal(authorities, 1788);
  assert.equal(allAmount, 1331428336499);
  assert.equal(allCount, 59630027);
  assert.ok(Math.abs(number(cell(history, 1887, 37)) * 1000 - allAmount) < 0.001);
  assert.equal(number(cell(history, 1887, 38)), allCount);
  return { rows, checks: { prefectures: 47, receiptHistoryMatches: 47, costComponentMatches: 47, authorities, nationalAmountYen: allAmount, nationalCount: allCount } };
}

export function extractDeductions(sheet, names) {
  assert.ok(String(cell(sheet, 2, 1)).includes('令和８年度課税'));
  assert.equal(cell(sheet, 14, 55), '市町村民税');
  assert.equal(cell(sheet, 14, 58), '道府県民税');
  const byName = new Map([...names].map(([code, name]) => [name, code]));
  const municipalities = [];
  const summaries = [];
  for (let r = 19; r <= 1807; r++) {
    const code = cell(sheet, r, 1);
    const name = cell(sheet, r, 2);
    const values = () => Object.fromEntries(DEDUCTIONS.map(([key, col]) => [key, number(cell(sheet, r, col))]));
    if (typeof code === 'number') {
      assert.ok(byName.has(name));
      assert.notEqual(String(code).padStart(6, '0').slice(2, 5), '000');
      municipalities.push({ code, name, values: values() });
    } else if (typeof name === 'string' && name.endsWith('集計')) {
      const areaName = name.slice(0, -2);
      assert.ok(byName.has(areaName));
      summaries.push({ areaCode: byName.get(areaName), areaName, sourceRow: r, values: values() });
    }
  }
  assert.equal(municipalities.length, 1741);
  assert.equal(new Set(municipalities.map((row) => row.code)).size, 1741);
  assert.equal(summaries.length, 47);
  assert.equal(new Set(summaries.map((row) => row.areaCode)).size, 47);
  // Conservative binary64 forward-error allowance, not currency rounding.
  const close = (actual, expected, terms) => assert.ok(Math.abs(actual - expected) <= Number.EPSILON * Math.max(actual, expected, 1) * (terms + 2));
  for (const [key, col] of DEDUCTIONS) {
    for (const row of summaries) {
      const group = municipalities.filter((entry) => entry.name === row.areaName);
      close(group.reduce((sum, entry) => sum + entry.values[key], 0), row.values[key], group.length);
    }
    close(summaries.reduce((sum, row) => sum + row.values[key], 0), number(cell(sheet, 1807, col)), 47);
  }
  return summaries;
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-furusato-sources' },
    out: { type: 'string', default: '.local/verification/themes/furusato-source.json' },
  } });
  await mkdir(options['source-dir'], { recursive: true });
  const books = {};
  for (const source of SOURCES) {
    const file = resolve(options['source-dir'], source.file);
    let bytes;
    try { bytes = await readFile(file); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(`https://www.soumu.go.jp/main_content/${source.file}`, { signal: AbortSignal.timeout(60000) });
      assert.ok(response.ok, `Source HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), source.sha256, 'Official source changed; revalidate before ingestion');
      await writeFile(file, bytes);
    }
    assert.equal(sha(bytes), source.sha256);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(bytes);
    books[source.key] = book;
  }
  const names = new Map(prefectures.map((row) => [row.prefCode, row.prefName]));
  const result = extractFurusato(books.receipts.getWorksheet('Sheet1'), books.history.getWorksheet('各団体一覧'), names);
  const deductions = extractDeductions(books.deductions.getWorksheet('集計表'), names);
  const generatedAt = new Date().toISOString();
  const files = [];
  for (const [key] of [...FIELDS, ...DEDUCTIONS]) {
    const config = METRICS_REGISTRY[key];
    const isDeduction = DEDUCTIONS.some(([metric]) => metric === key);
    const year = isDeduction ? '2026' : '2025';
    assert.ok(config?.isActive && config.source.kind === 'external' && config.source.config.provenance.url.endsWith(SOURCES[isDeduction ? 2 : 0].file));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows: (isDeduction ? deductions : result.rows).map((row) => ({ areaCode: row.areaCode, areaName: row.areaName, yearCode: year, yearName: `${year}年度${isDeduction ? '課税' : ''}`, value: row.values[key], unit: config.unit })), meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [year, year], recipe: buildRecipe(config) } });
    const bytes = JSON.stringify(payload);
    const relative = `app/stats/${key}/values.json`;
    files.push({ key: relative, metricKey: key, sha256: sha(bytes), sourceMatchedRows: 47 });
    if (options['write-local']) {
      const path = resolve(root, '.local/r2', relative);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES, ...result.checks, deductionChecks: 94, files, notes: ['都道府県自身の決算見込。市町村合算と区別する。東京都の特例控除対象外を表示する。', '控除は2026年度課税・2025暦年寄附分。公式の推計値を含み、受入額との差を損益としない。'] };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
